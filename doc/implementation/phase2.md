# Phase 2 Implementation: Core Game Logic - COMPLETE ✅

## Overview

**Phase:** Core Game Engine Foundation  
**Status:** **COMPLETE** ✅  
**Completion Date:** October 6, 2025  
**Actual Time:** ~8 hours  
**Confidence Level:** 10/10

**Achievement:** All 207 tests passing with 96.46% code coverage!

This phase focuses on creating a robust, well-tested game engine that can be shared between client and server. All code will be pure JavaScript functions with comprehensive unit tests.

---

## Task Breakdown

### Task 1: Project Setup & Structure
**Estimated Time:** 30 minutes  
**Priority:** High (Blocking)

#### What to Build
- Initialize npm project with `package.json`
- Install Jest testing framework
- Create folder structure
- Configure Jest
- Set up `.gitignore`
- Update `README.md` with setup instructions

#### Folder Structure
```
async-ricochet-robots/
├── shared/              # Shared game logic (isomorphic)
├── tests/               # Unit tests
├── doc/                 # ✅ Already complete
├── memory-bank/         # ✅ Already complete
├── package.json         # NEW
├── .gitignore           # NEW
└── README.md            # UPDATE
```

#### Files to Create
1. `package.json`:
   - Dependencies: None for core engine
   - Dev dependencies: `jest`
   - Scripts: `test`, `test:watch`, `test:coverage`

2. `.gitignore`:
   ```
   node_modules/
   coverage/
   .env
   .DS_Store
   ```

3. Update `README.md`:
   - Project description
   - Setup instructions (`npm install`, `npm test`)
   - Folder structure explanation

#### Success Criteria
- ✅ `npm install` runs successfully
- ✅ `npm test` runs (even with 0 tests)
- ✅ Folder structure matches plan
- ✅ Git repository initialized

#### Commands to Run
```bash
npm init -y
npm install --save-dev jest
mkdir shared tests
```

---

### Task 2: Core Data Structures & Types
**Estimated Time:** 30 minutes  
**Priority:** High (Blocking)  
**Dependencies:** Task 1

#### What to Build
**File:** `shared/types.js`

Create validation helpers and type definitions (using JSDoc for type documentation).

#### Functions to Implement

```javascript
/**
 * Validates a position object
 * @param {Object} pos - Position to validate
 * @param {number} pos.x - X coordinate (0-15)
 * @param {number} pos.y - Y coordinate (0-15)
 * @returns {boolean} True if valid position
 */
function isValidPosition(pos) { }

/**
 * Validates robot color
 * @param {string} color - Robot color
 * @returns {boolean} True if valid color
 */
function isValidRobotColor(color) { }

/**
 * Validates direction
 * @param {string} direction - Movement direction
 * @returns {boolean} True if valid direction
 */
function isValidDirection(direction) { }

/**
 * Validates move object
 * @param {Object} move - Move to validate
 * @param {string} move.robot - Robot color
 * @param {string} move.direction - Movement direction
 * @returns {boolean} True if valid move
 */
function isValidMove(move) { }

/**
 * Creates a deep copy of robot positions
 * @param {Object} robots - Robot positions {red: {x, y}, ...}
 * @returns {Object} Deep copy of robots
 */
function cloneRobots(robots) { }
```

#### Constants to Define
```javascript
const ROBOT_COLORS = ['red', 'yellow', 'green', 'blue'];
const DIRECTIONS = ['up', 'down', 'left', 'right'];
const BOARD_SIZE = 16;
const GOAL_COLORS = [...ROBOT_COLORS, 'multi'];
```

#### Test File
**File:** `tests/types.test.js`

Test cases:
- Valid positions (0-15 range)
- Invalid positions (negative, >15, non-integer)
- Valid/invalid robot colors
- Valid/invalid directions
- Valid/invalid move objects
- Deep clone doesn't mutate original

#### Success Criteria
- ✅ All validation functions work correctly
- ✅ Constants match documentation
- ✅ JSDoc comments complete
- ✅ All tests pass (15+ test cases)
- ✅ Test coverage 100%

---

### Task 3: Wall Collision Detection
**Estimated Time:** 1 hour  
**Priority:** High (Blocking)  
**Dependencies:** Task 2

#### What to Build
**File:** `shared/wall-utils.js`

Implement the critical wall collision detection logic.

#### Main Function

```javascript
/**
 * Check if a wall blocks movement from current position in given direction
 * @param {Object} walls - Wall structure {horizontal: [[]], vertical: [[]]}
 * @param {number} x - Current X position
 * @param {number} y - Current Y position
 * @param {string} direction - Movement direction ('up', 'down', 'left', 'right')
 * @returns {boolean} True if wall blocks movement
 */
function isWallBlocking(walls, x, y, direction) {
  // Implementation follows doc/game-rules.md wall format
}
```

#### Wall Format Reference
From documentation:
- `walls.horizontal[row]` = array of column indices where walls exist **below** that row
- `walls.vertical[col]` = array of row indices where walls exist **to the right** of that column

#### Direction-Specific Logic
- **Up**: Check `walls.horizontal[y-1]` includes `x`
- **Down**: Check `walls.horizontal[y]` includes `x`
- **Left**: Check `walls.vertical[x-1]` includes `y`
- **Right**: Check `walls.vertical[x]` includes `y`

#### Test File
**File:** `tests/wall-utils.test.js`

Test cases:
1. **Horizontal walls:**
   - Moving up blocked by wall above
   - Moving down blocked by wall below
   - Moving left/right not blocked by horizontal wall

2. **Vertical walls:**
   - Moving left blocked by wall to left
   - Moving right blocked by wall to right
   - Moving up/down not blocked by vertical wall

3. **Edge cases:**
   - Position at row 0, column 0
   - Position at row 15, column 15
   - Empty walls object (no walls)
   - Wall array doesn't include position (not blocked)

4. **Invalid inputs:**
   - Undefined walls
   - Invalid direction
   - Out of bounds position

#### Success Criteria
- ✅ All wall collision tests pass (20+ test cases)
- ✅ Matches wall format from documentation exactly
- ✅ Handles all 4 directions correctly
- ✅ Edge cases covered
- ✅ Test coverage 100%

---

### Task 4: Basic Robot Movement
**Estimated Time:** 1.5 hours  
**Priority:** High (Blocking)  
**Dependencies:** Tasks 2, 3

#### What to Build
**File:** `shared/game-engine.js`

Implement the core movement logic where robots slide until collision.

#### Main Function

```javascript
/**
 * Move a robot in the specified direction
 * @param {Object} walls - Wall structure
 * @param {Object} robots - Current robot positions {red: {x, y}, ...}
 * @param {string} robotColor - Which robot to move
 * @param {string} direction - Direction to move
 * @returns {Object} New robot positions (pure function, doesn't mutate)
 */
function moveRobot(walls, robots, robotColor, direction) {
  // 1. Clone robots (don't mutate input)
  // 2. Get current position
  // 3. Calculate slide path
  // 4. Check collisions (walls, robots, boundaries)
  // 5. Return new positions
}
```

#### Helper Function

```javascript
/**
 * Check if another robot is at the given position
 * @param {Object} robots - Robot positions
 * @param {number} x - X coordinate to check
 * @param {number} y - Y coordinate to check
 * @param {string} excludeRobot - Robot to exclude from check
 * @returns {boolean} True if robot at position
 */
function isRobotAt(robots, x, y, excludeRobot) { }
```

#### Collision Priority
1. **Board boundary** (x/y < 0 or > 15)
2. **Wall** (via `isWallBlocking`)
3. **Another robot** (via `isRobotAt`)

#### Test File
**File:** `tests/game-engine.test.js`

Test cases:
1. **Boundary collisions:**
   - Robot at (0, 5) moving left → stays at (0, 5)
   - Robot at (15, 5) moving right → stays at (15, 5)
   - Robot at (5, 0) moving up → stays at (5, 0)
   - Robot at (5, 15) moving down → stays at (5, 15)

2. **Wall collisions:**
   - Robot slides until wall
   - Robot already against wall doesn't move
   - Test all 4 directions with various wall positions

3. **Robot collisions:**
   - Robot slides until hitting another robot
   - Robot stops one cell before other robot
   - Test with multiple robots in path

4. **No collision (slides to boundary):**
   - Clear path to edge
   - All 4 directions

5. **Pure function behavior:**
   - Original robots object not mutated
   - Returns new object

#### Success Criteria
- ✅ Robot slides correctly until collision
- ✅ All collision types handled (boundary, wall, robot)
- ✅ Pure function (no mutation)
- ✅ All tests pass (25+ test cases)
- ✅ Test coverage 100%

---

### Task 5: Solution Validation (Single-Color)
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Task 4

#### What to Build
**File:** `shared/game-engine.js` (add to existing file)

Validate that a sequence of moves reaches the goal.

#### Main Function

```javascript
/**
 * Validate a solution for a puzzle
 * @param {Object} puzzle - Puzzle data
 * @param {Object} puzzle.walls - Wall structure
 * @param {Object} puzzle.robots - Initial robot positions
 * @param {Object} puzzle.goalPosition - Goal position {x, y}
 * @param {string} puzzle.goalColor - Goal color or 'multi'
 * @param {Array} solutionData - Array of moves [{robot, direction}, ...]
 * @returns {Object} {valid, moveCount, winningRobot, error}
 */
function validateSolution(puzzle, solutionData) {
  // 1. Validate input format
  // 2. Clone initial robot positions
  // 3. Replay each move
  // 4. Check if correct robot at goal
  // 5. Return result
}
```

#### Return Object Structure
```javascript
// Success:
{
  valid: true,
  moveCount: 7,
  winningRobot: 'red',
  error: null
}

// Failure:
{
  valid: false,
  moveCount: 0,
  winningRobot: null,
  error: 'Red robot did not reach goal. Final: (5, 7), Goal: (7, 7)'
}
```

#### Validation Rules (Single-Color First)
1. Solution must be non-empty array
2. Each move must be valid format
3. Each move must have valid robot and direction
4. **For single-color goals:** Specific robot must reach goal position
5. Return detailed error messages

#### Test File
**File:** `tests/game-engine.test.js` (add to existing)

Test cases:
1. **Valid solutions:**
   - Simple 1-move solution
   - Complex multi-move solution
   - Solution using blocker robots

2. **Invalid format:**
   - Empty solution array
   - Invalid robot color in move
   - Invalid direction in move
   - Missing robot/direction properties

3. **Invalid solutions:**
   - Doesn't reach goal position
   - Wrong robot reaches goal (single-color)
   - Correct robot but wrong position

4. **Edge cases:**
   - Solution where robot doesn't move (already blocked)
   - Very long solution (50+ moves)

#### Success Criteria
- ✅ Validates move sequences correctly
- ✅ Replays moves accurately
- ✅ Clear error messages
- ✅ All tests pass (20+ test cases)
- ✅ **Focus on single-color goals** (multi-color in Task 6)

---

### Task 6: Multi-Color Goal Support
**Estimated Time:** 45 minutes  
**Priority:** Medium  
**Dependencies:** Task 5

#### What to Build
**File:** `shared/game-engine.js` (enhance existing `validateSolution`)

Extend validation to support multi-color goals where ANY robot can win.

#### Enhancement to `validateSolution`

```javascript
function validateSolution(puzzle, solutionData) {
  // ... existing validation ...
  
  // NEW: Check goal color
  if (puzzle.goalColor === 'multi') {
    // ANY robot at goal position wins
    for (const [color, position] of Object.entries(finalRobots)) {
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
    // Specific robot must reach goal (existing logic)
    // ...
  }
}
```

#### Key Differences
- **Single-color:** Only specified robot can win
- **Multi-color:** First robot to reach goal wins (any color)
- **`winningRobot`:** Must be tracked for leaderboard display

#### Test File
**File:** `tests/game-engine.test.js` (add to existing)

Test cases:
1. **Multi-color valid:**
   - Red robot reaches multi-color goal
   - Yellow robot reaches multi-color goal
   - Blue robot reaches multi-color goal
   - Green robot reaches multi-color goal

2. **Multi-color invalid:**
   - No robot reaches goal
   - Robot near but not at goal

3. **Winning robot tracking:**
   - Verify correct robot identified
   - Multiple robots move, right one wins

4. **Comparison:**
   - Same goal, different robots used
   - Different move counts possible

#### Success Criteria
- ✅ Multi-color validation works
- ✅ `winningRobot` tracked correctly
- ✅ Both single and multi-color tests pass
- ✅ All tests pass (30+ total validation tests)
- ✅ Test coverage 100%

---

### Task 7: L-Shape Wall Helper Functions
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Task 2

#### What to Build
**File:** `shared/wall-generator.js`

Create utilities for L-shaped wall generation and overlap detection.

#### Functions to Implement

```javascript
/**
 * Get wall positions for an L-shaped wall piece
 * @param {Object} position - Goal position {x, y}
 * @param {string} orientation - 'NW', 'NE', 'SW', or 'SE'
 * @returns {Array} [{type: 'horizontal'|'vertical', row, col}, ...]
 */
function getLShapeWallPositions(position, orientation) {
  // Returns 2 wall positions forming L-shape corner
}

/**
 * Add an L-shaped wall to the walls structure
 * @param {Object} walls - Walls structure to modify
 * @param {Object} position - Goal position {x, y}
 * @param {string} orientation - L-shape orientation
 */
function addLShapeWall(walls, position, orientation) {
  // Mutates walls object to add 2 wall segments
}

/**
 * Check if two sets of walls overlap
 * @param {Array} walls1 - First set of wall positions
 * @param {Array} walls2 - Second set of wall positions
 * @returns {boolean} True if any wall segments overlap
 */
function wallsOverlap(walls1, walls2) {
  // Check if same type and position
}

/**
 * Check if an L-shape can be placed without overlapping
 * @param {Object} walls - Current walls structure
 * @param {Object} position - Proposed goal position
 * @param {string} orientation - Proposed orientation
 * @param {Array} existingLShapes - Array of existing L-shapes
 * @returns {boolean} True if placement is valid
 */
function canPlaceLShape(walls, position, orientation, existingLShapes) {
  // Check against all existing L-shapes
}
```

#### L-Shape Orientations

From documentation:
```
'NW': ┐  // Walls on top and RIGHT
'NE': ┌  // Walls on top and LEFT  
'SW': ┘  // Walls on bottom and RIGHT
'SE': └  // Walls on bottom and LEFT
```

**Note:** Documentation shows orientation names, verify which walls block which directions.

#### Test File
**File:** `tests/wall-generator.test.js`

Test cases:
1. **L-shape positions:**
   - NW orientation creates correct walls
   - NE orientation creates correct walls
   - SW orientation creates correct walls
   - SE orientation creates correct walls

2. **Wall addition:**
   - Adds to correct horizontal/vertical arrays
   - Doesn't add duplicates
   - Handles empty walls object

3. **Overlap detection:**
   - Detects same horizontal wall
   - Detects same vertical wall
   - Detects no overlap
   - Multiple L-shapes tested

4. **Placement validation:**
   - Valid placement (no overlaps)
   - Invalid placement (overlaps existing)
   - Edge cases (boundary positions)

#### Success Criteria
- ✅ All 4 orientations work correctly
- ✅ Overlap detection is accurate
- ✅ Wall positions match format
- ✅ All tests pass (25+ test cases)
- ✅ Test coverage 100%

---

### Task 8: Goal Placement Logic
**Estimated Time:** 1.5 hours  
**Priority:** High  
**Dependencies:** Tasks 2, 7

#### What to Build
**File:** `shared/puzzle-generator.js`

Implement quadrant-based goal placement with L-shaped walls.

#### Functions to Implement

```javascript
/**
 * Define quadrant boundaries
 */
const QUADRANTS = [
  { name: 'NW', xMin: 1, xMax: 7, yMin: 1, yMax: 7 },
  { name: 'NE', xMin: 8, xMax: 14, yMin: 1, yMax: 7 },
  { name: 'SW', xMin: 1, xMax: 7, yMin: 8, yMax: 14 },
  { name: 'SE', xMin: 8, xMax: 14, yMin: 8, yMax: 14 }
];

/**
 * Place goals in a quadrant with L-shaped walls
 * @param {Object} quadrant - Quadrant definition
 * @param {Array} colors - Colors to place in this quadrant
 * @param {Object} walls - Walls structure (modified)
 * @param {Array} existingLShapes - Existing L-shapes (modified)
 * @returns {Array} Goals placed [{position, color}, ...]
 */
function placeGoalsInQuadrant(quadrant, colors, walls, existingLShapes) {
  // 1. For each color
  // 2. Try random positions within quadrant
  // 3. Try random orientations
  // 4. Check if L-shape can be placed (no overlap)
  // 5. Add L-shape and goal
  // 6. Max attempts: 100 per goal
}

/**
 * Add center 2×2 blocked area
 * @param {Object} walls - Walls structure
 */
function addCenterWalls(walls) {
