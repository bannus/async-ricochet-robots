# Async Ricochet Robots - Game Rules & Puzzle Generation

## Ricochet Robots Overview

Ricochet Robots is a puzzle game where players maneuver colored robots on a grid to reach a goal position using the fewest moves possible. The key mechanic is that robots slide in straight lines until they hit an obstacle (wall or another robot).

---

# Game Rules

## Board Setup

### Grid
- **Size**: 16×16 grid
- **Coordinates**: (0,0) at top-left, (15,15) at bottom-right
- **Boundary**: Outer walls on all four edges (implicit)

### Robots
- **Count**: 4 robots (Red, Yellow, Green, Blue)
- **Starting Positions**: Randomly placed at board generation, no two robots on same cell
- **Persistence**: Robots stay in their final positions after each round (creates evolving difficulty)
- **Representation**: Each robot occupies exactly one cell

### Walls
- **Types**: 
  - Horizontal walls (block vertical movement)
  - Vertical walls (block horizontal movement)
- **Structure**: 
  - 17 L-shaped wall pieces (2 walls forming a corner, one per goal)
  - 8 outer edge walls (2 per quadrant on outer boundaries)
- **Center Area**: The 4 center cells (7,7), (7,8), (8,7), (8,8) form a walled-off 2×2 square
- **Outer Edge Walls**: Each quadrant has one wall on each of its two outer edges, positioned 2-7 cells from the corner
- **Total Wall Segments**: ~42 wall segments (17 L-shapes × 2 + 8 outer edges)

### Goals
- **Total Goals**: 17 per board
  - 16 single-color goals (4 colors × 4 quadrants)
  - Exactly 1 multi-color goal (placed randomly in one quadrant)
- **Distribution**: 
  - Each quadrant (8×8) contains 4-5 goals (16 single-color + 1 multi-color = 17 total)
  - Goals cannot be on outer boundary (rows/cols 0 or 15)
  - Each goal sits in the corner of an L-shaped wall
  - L-shaped walls cannot touch or overlap each other
- **Positioning**: Goals are placed randomly within their quadrant constraints
- **Multi-Color Goal**: Can be reached by ANY robot (flexible winning condition)

### Round Goal
- **Selection**: One goal is selected for each round
- **Goal Color**: Indicates which robot(s) can win
  - Single-color goals: Only that color robot can win
  - Multi-color goal: Any of the 4 robots can win
- **Objective**: Move the appropriate robot to the goal position

## Movement Rules

### Basic Movement
1. A robot can move in one of four directions: **up**, **down**, **left**, **right**
2. When moved, a robot **slides** until it hits an obstacle:
   - Board boundary (edge)
   - Wall
   - Another robot
3. A robot cannot stop mid-slide (no "braking")
4. A robot stays in place if it's already against an obstacle in the direction of movement

### Move Definition
- **One Move**: Select a robot and direction → robot slides until collision
- Any robot can be moved (not just the goal robot)
- Non-goal robots can be used as "blockers" to stop the goal robot

### Example Moves

```
Initial State:
  0 1 2 3 4 5
0 . . . . . .
1 . . R . . .
2 . . . . . .
3 . . . . B .
4 . . . . . .

Move: Red Up
  0 1 2 3 4 5
0 . . R . . .  ← Red slides to row 0 (boundary)
1 . . . . . .
2 . . . . . .
3 . . . . B .
4 . . . . . .

Move: Blue Left
  0 1 2 3 4 5
0 . . R . . .
1 . . . . . .
2 . . . . . .
3 B . . . . .  ← Blue slides to column 0 (boundary)
4 . . . . . .

Move: Red Right
  0 1 2 3 4 5
0 . . . . . R  ← Red slides to column 5 (boundary)
1 . . . . . .
2 . . . . . .
3 B . . . . .
4 . . . . . .

Move: Red Down
  0 1 2 3 4 5
0 . . . . . .
1 . . . . . .
2 . . . . . .
3 B . . . . R  ← Red stops at row 3 (blocked by Blue)
4 . . . . . .
```

## Winning Condition

### Single-Color Goals
The puzzle is solved when the **specified robot** reaches the **goal position**.

**Example:**
- Goal: Red robot at (3, 5)
- Winning condition: Red robot must be at (3, 5)
- Other robots: Positions irrelevant

### Multi-Color Goal
The puzzle is solved when **ANY robot** reaches the **goal position**.

**Example:**
- Goal: Multi-color at (7, 9)
- Winning condition: Red OR Yellow OR Green OR Blue at (7, 9)
- All solutions are equally valid
- Leaderboard tracks which robot was used

## Solution Quality

- Solutions are ranked by **total move count** (fewest moves wins)
- No time limit (asynchronous gameplay)
- Tied solutions: First submitted wins priority in display (but shares same rank)
- For multi-color goals: Different robots can win with different move counts

## Game Lifecycle

### Board Persistence
- One board contains 17 goals
- Board is generated once at game creation
- Same board used for all rounds until game completion
- Robots persist in their positions between rounds

### Round Progression
- Host creates rounds one at a time
- Each round selects one unused goal from the board
- Goal selection is random from incomplete goals
- Goals can be skipped (deferred) if too easy
- Skipped goals return to the available pool

### Game Completion
- Game ends when all 17 goals are completed
- Skipped goals don't count toward completion
- Host must create a new game for a fresh board
- Cannot create more rounds after 17 completions

---

# Puzzle Generation

## Objectives

1. **Systematic Goal Placement**: 17 goals distributed across 4 quadrants (16 single-color + 1 multi-color)
2. **L-Shaped Walls**: Every goal sits in a corner formed by 2 walls
3. **Non-Overlapping L-Shapes**: L-shaped walls cannot touch or overlap each other
4. **Solvability**: Every goal must be reachable (guaranteed by L-shape design)
5. **Fairness**: Goals should require meaningful solutions (3+ moves minimum)
6. **Variety**: Random placement within constraints for unique boards

## Generation Algorithm

### Step 1: Initialize Board Structure

```javascript
function generatePuzzle() {
  const walls = {
    horizontal: Array(16).fill(null).map(() => []),
    vertical: Array(16).fill(null).map(() => [])
  };
  
  // Add center 2×2 blocked area
  // Horizontal walls below rows 7 and 8 at columns 7-8
  walls.horizontal[7].push(7, 8);
  walls.horizontal[8].push(7, 8);
  // Vertical walls right of columns 7 and 8 at rows 7-8
  walls.vertical[7].push(7, 8);
  walls.vertical[8].push(7, 8);
  
  // Add outer edge walls (2 per quadrant = 8 total)
  // Each wall positioned 2-7 cells from corner
  addOuterEdgeWalls(walls);
  
  const allGoals = [];
  
  // Continue to next steps...
}

function addOuterEdgeWalls(walls) {
  // NW quadrant: top edge and left edge
  const nwTopCol = randomInt(2, 7);  // Top edge (row 0)
  const nwLeftRow = randomInt(2, 7); // Left edge (col 0)
  if (!walls.horizontal[0]) walls.horizontal[0] = [];
  walls.horizontal[0].push(nwTopCol);
  if (!walls.vertical[0]) walls.vertical[0] = [];
  walls.vertical[0].push(nwLeftRow);
  
  // NE quadrant: top edge and right edge
  const neTopCol = randomInt(8, 13);  // Top edge (row 0)
  const neRightRow = randomInt(2, 7); // Right edge (col 15)
  walls.horizontal[0].push(neTopCol);
  if (!walls.vertical[15]) walls.vertical[15] = [];
  walls.vertical[15].push(neRightRow);
  
  // SW quadrant: bottom edge and left edge
  const swBottomCol = randomInt(2, 7);  // Bottom edge (row 15)
  const swLeftRow = randomInt(8, 13);   // Left edge (col 0)
  if (!walls.horizontal[15]) walls.horizontal[15] = [];
  walls.horizontal[15].push(swBottomCol);
  walls.vertical[0].push(swLeftRow);
  
  // SE quadrant: bottom edge and right edge
  const seBottomCol = randomInt(8, 13);  // Bottom edge (row 15)
  const seRightRow = randomInt(8, 13);   // Right edge (col 15)
  walls.horizontal[15].push(seBottomCol);
  walls.vertical[15].push(seRightRow);
}
```

### Step 2: Generate Goals by Quadrant

```javascript
// Define quadrants (excluding outer boundary)
const quadrants = [
  { name: 'NW', xMin: 1, xMax: 7, yMin: 1, yMax: 7 },
  { name: 'NE', xMin: 8, xMax: 14, yMin: 1, yMax: 7 },
  { name: 'SW', xMin: 1, xMax: 7, yMin: 8, yMax: 14 },
  { name: 'SE', xMin: 8, xMax: 14, yMin: 8, yMax: 14 }
];

const colors = ['red', 'yellow', 'green', 'blue'];
const existingLShapes = [];

// Generate 4 goals per quadrant (16 single-color goals)
for (const quadrant of quadrants) {
  for (const color of colors) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      // Random position within quadrant
      const x = randomInt(quadrant.xMin, quadrant.xMax);
      const y = randomInt(quadrant.yMin, quadrant.yMax);
      const position = { x, y };
      
      // Random L-shape orientation
      const orientation = randomChoice(['NW', 'NE', 'SW', 'SE']);
      
      // Check if L-shape would overlap with existing L-shapes
      if (canPlaceLShape(walls, position, orientation, existingLShapes)) {
        // Add L-shaped wall at this position
        addLShapeWall(walls, position, orientation);
        existingLShapes.push({ position, orientation });
        
        // Record goal
        allGoals.push({ position, color });
        placed = true;
      }
      
      attempts++;
    }
    
    if (!placed) {
      throw new Error(`Unable to place ${color} goal in ${quadrant.name} quadrant without L-shape overlap`);
    }
  }
}

// Generate multi-color goal in random quadrant
const multiQuadrant = randomChoice(quadrants);
let multiPlaced = false;
let multiAttempts = 0;

while (!multiPlaced && multiAttempts < 100) {
  const x = randomInt(multiQuadrant.xMin, multiQuadrant.xMax);
  const y = randomInt(multiQuadrant.yMin, multiQuadrant.yMax);
  const position = { x, y };
  const orientation = randomChoice(['NW', 'NE', 'SW', 'SE']);
  
  if (canPlaceLShape(walls, position, orientation, existingLShapes)) {
    addLShapeWall(walls, position, orientation);
    existingLShapes.push({ position, orientation });
    allGoals.push({ position, color: 'multi' });
    multiPlaced = true;
  }
  
  multiAttempts++;
}

if (!multiPlaced) {
  throw new Error('Unable to place multi-color goal without L-shape overlap');
}
```

### Step 3: L-Shape Overlap Detection

```javascript
function canPlaceLShape(walls, position, orientation, existingLShapes) {
  // Get the two wall positions this L-shape would create
  const wallPositions = getLShapeWallPositions(position, orientation);
  
  // Check against each existing L-shape
  for (const existing of existingLShapes) {
    const existingWalls = getLShapeWallPositions(existing.position, existing.orientation);
    
    // Check if any wall segment overlaps
    if (wallsOverlap(wallPositions, existingWalls)) {
      return false;
    }
  }
  
  return true;
}

function getLShapeWallPositions(position, orientation) {
  const { x, y } = position;
  const walls = [];
  
  switch (orientation) {
    case 'NW': // ┏ - walls on top and LEFT
      walls.push({ type: 'horizontal', row: y - 1, col: x });
      walls.push({ type: 'vertical', col: x - 1, row: y });
      break;
    case 'NE': // ┓ - walls on top and RIGHT
      walls.push({ type: 'horizontal', row: y - 1, col: x });
      walls.push({ type: 'vertical', col: x, row: y });
      break;
    case 'SW': // ┗ - walls on bottom and LEFT
      walls.push({ type: 'horizontal', row: y, col: x });
      walls.push({ type: 'vertical', col: x - 1, row: y });
      break;
    case 'SE': // ┛ - walls on bottom and RIGHT
      walls.push({ type: 'horizontal', row: y, col: x });
      walls.push({ type: 'vertical', col: x, row: y });
      break;
  }
  
  return walls;
}

function wallsOverlap(walls1, walls2) {
  for (const w1 of walls1) {
    for (const w2 of walls2) {
      // Check if same type and same position
      if (w1.type === w2.type) {
        if (w1.type === 'horizontal' && w1.row === w2.row && w1.col === w2.col) {
          return true;
        }
        if (w1.type === 'vertical' && w1.col === w2.col && w1.row === w2.row) {
          return true;
        }
      }
    }
  }
  return false;
}
```

### Step 4: L-Shaped Wall Placement

```javascript
function addLShapeWall(walls, position, orientation) {
  const { x, y } = position;
  
  // Each orientation creates walls that form a corner
  // Goal sits IN the corner (blocked on two sides)
  
  switch (orientation) {
    case 'NW': // ┏ - walls on top and LEFT
      // Horizontal wall above (blocks upward movement)
      if (!walls.horizontal[y - 1]) walls.horizontal[y - 1] = [];
      if (!walls.horizontal[y - 1].includes(x)) {
        walls.horizontal[y - 1].push(x);
      }
      // Vertical wall to LEFT (blocks leftward movement)
      if (!walls.vertical[x - 1]) walls.vertical[x - 1] = [];
      if (!walls.vertical[x - 1].includes(y)) {
        walls.vertical[x - 1].push(y);
      }
      break;
      
    case 'NE': // ┓ - walls on top and RIGHT
      // Horizontal wall above
      if (!walls.horizontal[y - 1]) walls.horizontal[y - 1] = [];
      if (!walls.horizontal[y - 1].includes(x)) {
        walls.horizontal[y - 1].push(x);
      }
      // Vertical wall to RIGHT (blocks rightward movement)
      if (!walls.vertical[x]) walls.vertical[x] = [];
      if (!walls.vertical[x].includes(y)) {
        walls.vertical[x].push(y);
      }
      break;
      
    case 'SW': // ┗ - walls on bottom and LEFT
      // Horizontal wall below (blocks downward movement)
      if (!walls.horizontal[y]) walls.horizontal[y] = [];
      if (!walls.horizontal[y].includes(x)) {
        walls.horizontal[y].push(x);
      }
      // Vertical wall to LEFT
      if (!walls.vertical[x - 1]) walls.vertical[x - 1] = [];
      if (!walls.vertical[x - 1].includes(y)) {
        walls.vertical[x - 1].push(y);
      }
      break;
      
    case 'SE': // ┛ - walls on bottom and RIGHT
      // Horizontal wall below
      if (!walls.horizontal[y]) walls.horizontal[y] = [];
      if (!walls.horizontal[y].includes(x)) {
        walls.horizontal[y].push(x);
      }
      // Vertical wall to RIGHT
      if (!walls.vertical[x]) walls.vertical[x] = [];
      if (!walls.vertical[x].includes(y)) {
        walls.vertical[x].push(y);
      }
      break;
  }
}
```

### Step 4: Place Robots

```javascript
function placeRobots(walls, allGoals) {
  const robots = {};
  const occupied = new Set();
  
  // Mark all goal positions as occupied
  for (const goal of allGoals) {
    occupied.add(`${goal.position.x},${goal.position.y}`);
  }
  
  const colors = ['red', 'yellow', 'green', 'blue'];
  for (const color of colors) {
    let position;
    do {
      position = {
        x: randomInt(0, 15),
        y: randomInt(0, 15)
      };
    } while (occupied.has(`${position.x},${position.y}`));
    
    robots[color] = position;
    occupied.add(`${position.x},${position.y}`);
  }
  
  return robots;
}
```

### Step 5: Complete Puzzle

```javascript
function generatePuzzle() {
  // ... steps 1-3 above ...
  
  const robots = placeRobots(walls, allGoals);
  
  return {
    walls,
    robots,
    allGoals,
    completedGoalIndices: []  // None completed yet
  };
}
```

## Difficulty Considerations

While we don't actively tune for difficulty during generation, puzzles naturally vary:

- **Early rounds**: Robots in starting positions, may have easy paths
- **Later rounds**: Robots scattered from previous solutions, creates complexity
- **Multi-color goals**: Usually more solution paths (any robot can win)
- **Corner goals**: Often require more setup moves

Host can skip goals that appear too simple, deferring them to later rounds when robot positions make them more interesting.

---

# Movement Implementation

## Core Movement Function

```javascript
function moveRobot(walls, robots, robotColor, direction) {
  const robot = robots[robotColor];
  const { x, y } = robot;
  
  let newX = x;
  let newY = y;
  
  // Direction vectors
  const directions = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
  };
  
  const { dx, dy } = directions[direction];
  
  // Slide until collision
  while (true) {
    const nextX = newX + dx;
    const nextY = newY + dy;
    
    // Check boundary
    if (nextX < 0 || nextX > 15 || nextY < 0 || nextY > 15) {
      break;
    }
    
    // Check walls
    if (isWallBlocking(walls, newX, newY, direction)) {
      break;
    }
    
    // Check other robots
    if (isRobotAt(robots, nextX, nextY, robotColor)) {
      break;
    }
    
    // Continue sliding
    newX = nextX;
    newY = nextY;
  }
  
  // Update robot position
  const moved = (newX !== x || newY !== y);
  if (moved) {
    robots[robotColor] = { x: newX, y: newY };
  }
  
  return moved;
}
```

## Wall Collision Detection

```javascript
function isWallBlocking(walls, x, y, direction) {
  switch (direction) {
    case 'up':
      // Check horizontal wall above current cell
      return walls.horizontal[y - 1]?.includes(x) || false;
    case 'down':
      // Check horizontal wall below current cell
      return walls.horizontal[y]?.includes(x) || false;
    case 'left':
      // Check vertical wall to left of current cell
      return walls.vertical[x - 1]?.includes(y) || false;
    case 'right':
      // Check vertical wall to right of current cell
      return walls.vertical[x]?.includes(y) || false;
  }
  return false;
}
```

## Robot Collision Detection

```javascript
function isRobotAt(robots, x, y, excludeRobot) {
  for (const [color, position] of Object.entries(robots)) {
    if (color !== excludeRobot && position.x === x && position.y === y) {
      return true;
    }
  }
  return false;
}
```

---

# Solution Validation

## Server-Side Validation

When a player submits a solution, the server must verify it:

```javascript
function validateSolution(puzzle, solutionData) {
  const { walls, robots: initialRobots, goalPosition, goalColor } = puzzle.currentRound;
  
  // Clone robots to simulate
  const robots = cloneRobots(initialRobots);
  
  // Replay each move
  for (const move of solutionData) {
    const { robot, direction } = move;
    
    // Validate move format
    if (!['red', 'yellow', 'green', 'blue'].includes(robot)) {
      return { valid: false, error: 'Invalid robot color' };
    }
    if (!['up', 'down', 'left', 'right'].includes(direction)) {
      return { valid: false, error: 'Invalid direction' };
    }
    
    // Execute move
    moveRobot(walls, robots, robot, direction);
  }
  
  // Check if goal reached
  if (goalColor === 'multi') {
    // Multi-color: ANY robot at goal position wins
    for (const [color, position] of Object.entries(robots)) {
      if (position.x === goalPosition.x && position.y === goalPosition.y) {
        return {
          valid: true,
          moveCount: solutionData.length,
          winningRobot: color
        };
      }
    }
    return {
      valid: false,
      error: 'No robot reached multi-color goal position'
    };
  } else {
    // Single-color: Specific robot must reach goal
    const finalPosition = robots[goalColor];
    if (finalPosition.x === goalPosition.x && 
        finalPosition.y === goalPosition.y) {
      return {
        valid: true,
        moveCount: solutionData.length,
        winningRobot: goalColor
      };
    }
    return {
      valid: false,
      error: `${goalColor} robot did not reach goal. Final: (${finalPosition.x}, ${finalPosition.y}), Goal: (${goalPosition.x}, ${goalPosition.y})`
    };
  }
}
```

## Client-Side Validation

The client can validate locally before submission to provide immediate feedback:

```javascript
function validateLocalSolution(puzzle, moves) {
  const result = validateSolution(puzzle, moves);
  
  if (!result.valid) {
    showError(result.error);
    return false;
  }
  
  showSuccess(`Valid solution with ${result.moveCount} moves using ${result.winningRobot} robot!`);
  return true;
}
```

---

# Wall Format Details

## Horizontal Walls

Horizontal walls block vertical movement (up/down).

**Storage**: `walls.horizontal[row]` = array of column indices

**Interpretation**: 
- `walls.horizontal[3] = [5, 7]` means:
  - Horizontal wall below row 3 at column 5
  - Horizontal wall below row 3 at column 7

**Visual**:
```
Row 3: . . . . . W . W .
       --------------------
Row 4: . . . . . . . . .
       (wall blocks movement from row 3 to row 4 at columns 5 and 7)
```

## Vertical Walls

Vertical walls block horizontal movement (left/right).

**Storage**: `walls.vertical[col]` = array of row indices

**Interpretation**:
- `walls.vertical[4] = [2, 6]` means:
  - Vertical wall right of column 4 at row 2
  - Vertical wall right of column 4 at row 6

**Visual**:
```
     Col 4  Col 5
Row 2:  . |  .
Row 3:  .    .
Row 4:  .    .
Row 5:  .    .
Row 6:  . |  .
(wall blocks movement from column 4 to column 5 at rows 2 and 6)
```

---

# Testing Puzzles

## Test Cases

### Test 1: Simple Wall Collision
```javascript
{
  walls: { 
    horizontal: [[2]],  // Wall below row 0 at col 2
    vertical: [[]]
  },
  robots: {
    red: { x: 2, y: 5 },
    yellow: { x: 15, y: 0 },
    green: { x: 0, y: 15 },
    blue: { x: 15, y: 15 }
  },
  currentRound: {
    goalColor: 'red',
    goalPosition: { x: 2, y: 1 }
  }
}

// Solution:
// Move red up → (2, 1) [stops at wall below row 0]
// 1 move solution
```

### Test 2: Multi-Color Goal
```javascript
{
  // ... board setup ...
  currentRound: {
    goalColor: 'multi',
    goalPosition: { x: 7, y: 9 }
  }
}

// Valid solutions could use any robot:
// Solution A: Get red to (7, 9) in 5 moves
// Solution B: Get blue to (7, 9) in 4 moves
// Both are valid, blue wins leaderboard
```

### Test 3: Using Blockers
```javascript
// Goal: Get red to (5, 5) using other robots as blockers
// This tests that robots properly stop other robots
```

## Validation Tests

```javascript
describe('Solution Validation', () => {
  it('accepts valid single-color solution', () => {
    const puzzle = generatePuzzle();
    const round = { goalColor: 'red', goalPosition: { x: 5, y: 5 } };
    const solution = [
      { robot: 'red', direction: 'right' },
      { robot: 'red', direction: 'down' }
    ];
    const result = validateSolution({ ...puzzle, currentRound: round }, solution);
    expect(result.valid).toBe(true);
    expect(result.winningRobot).toBe('red');
  });
  
  it('accepts valid multi-color solution with any robot', () => {
    const round = { goalColor: 'multi', goalPosition: { x: 7, y: 9 } };
    const solution = [
      { robot: 'blue', direction: 'up' },
      { robot: 'blue', direction: 'right' }
    ];
    const result = validateSolution({ ...puzzle, currentRound: round }, solution);
    expect(result.valid).toBe(true);
    expect(result.winningRobot).toBe('blue');
  });
  
  it('rejects invalid robot color', () => {
    const solution = [{ robot: 'purple', direction: 'up' }];
    const result = validateSolution(puzzle, solution);
    expect(result.valid).toBe(false);
  });
  
  it('rejects solution that doesn\'t reach goal', () => {
    const solution = [
      { robot: 'red', direction: 'up' },
      { robot: 'red', direction: 'left' }
    ];
    const result = validateSolution(puzzle, solution);
    expect(result.valid).toBe(false);
  });
  
  it('rejects wrong robot for single-color goal', () => {
    const round = { goalColor: 'red', goalPosition: { x: 5, y: 5 } };
    const solution = [
      { robot: 'blue', direction: 'right' }  // Blue reaches goal, but goal is red-only
    ];
    const result = validateSolution({ ...puzzle, currentRound: round }, solution);
    expect(result.valid).toBe(false);
  });
});
```

---

# Strategy Guide (For Players)

## Basic Strategies

1. **Work Backwards**: Start from the goal and think about how to position the goal robot
2. **Use Blockers**: Non-goal robots are tools to stop the goal robot mid-board
3. **Minimize Moves**: Each robot movement counts, including non-goal robots
4. **Visualize Paths**: Trace the slide path before executing

## Advanced Techniques

1. **Chaining**: Set up multiple robots to create stopping points
2. **Corner Traps**: Use walls and corners to create precise stopping positions
3. **Robot Relay**: Move one robot to create a stop for another
4. **Multi-Color Strategy**: For multi-color goals, evaluate all 4 robots to find shortest path

## Multi-Color Goal Tips

- Any robot can win, so check all options
- Sometimes a "wrong" robot has an easier path
- Different robots may require different numbers of moves
- Leaderboard shows which robot each player used

## Example Solution Breakdown

```
Goal: Get Red to (7, 7) [single-color]
Initial: Red at (2, 2)

Step 1: Move Blue right → creates blocker at (7, 0)
Step 2: Move Red down → slides to (2, 15)
Step 3: Move Red right → slides to (15, 15)
Step 4: Move Yellow down → creates blocker at (15, 7)
Step 5: Move Red left → stops at (8, 15) (blocked by nothing, hits boundary)
Step 6: Move Red up → stops at (8, 7) (blocked by Yellow)
Step 7: Move Red left → stops at (7, 7) (goal!)

Total: 7 moves
```

---

# References

- Original Ricochet Robots game by Alex Randolph
- Board game published by Rio Grande Games
- Digital implementations: Various (this is an original implementation)
- Classic 16×16 grid with L-shaped wall pieces and quadrant-based goal distribution
