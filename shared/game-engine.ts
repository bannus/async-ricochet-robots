/**
 * Core game engine for Async Ricochet Robots
 * Handles robot movement, collision detection, and game state management
 */

import type { Position, Robots, Walls, Move, DirectionValue } from './types';
import { Direction, BOARD_SIZE, cloneRobots } from './types.js';
import { isWallBlocking } from './wall-utils.js';
import { initializeWalls, addCenterSquare, addOuterEdgeWalls } from './l-shape-utils.js';
import { generateAllGoals } from './goal-placement.js';

/**
 * Moves a robot in the specified direction until it hits an obstacle
 * 
 * The robot slides until it encounters:
 * - A wall in the direction of movement
 * - Another robot
 * - The board edge
 * 
 * @param robots - Current positions of all robots
 * @param walls - Wall configuration
 * @param robotColor - Which robot to move ('red', 'yellow', 'green', 'blue')
 * @param direction - Direction to move ('up', 'down', 'left', 'right')
 * @returns New position of the moved robot
 * 
 * @example
 * const newPos = moveRobot(robots, walls, 'red', 'up');
 */
export function moveRobot(
  robots: Robots,
  walls: Walls,
  robotColor: keyof Robots,
  direction: DirectionValue
): Position {
  const startPos = robots[robotColor];
  let { x, y } = startPos;

  // Determine direction deltas
  let dx = 0;
  let dy = 0;
  switch (direction) {
    case Direction.Up:
      dy = -1;
      break;
    case Direction.Down:
      dy = 1;
      break;
    case Direction.Left:
      dx = -1;
      break;
    case Direction.Right:
      dx = 1;
      break;
  }

  // Slide until hitting an obstacle
  while (true) {
    const nextX = x + dx;
    const nextY = y + dy;

    // Check board boundaries
    if (nextX < 0 || nextX >= BOARD_SIZE || nextY < 0 || nextY >= BOARD_SIZE) {
      break;
    }

    // Check if wall blocks movement from current position
    if (isWallBlocking(walls, x, y, direction)) {
      break;
    }

    // Check if another robot is at the next position
    if (isRobotAt(robots, robotColor, nextX, nextY)) {
      break;
    }

    // Move to next position
    x = nextX;
    y = nextY;
  }

  return { x, y };
}

/**
 * Checks if any robot (except the specified one) is at the given position
 * 
 * @param robots - Current robot positions
 * @param excludeRobot - Robot to exclude from check
 * @param x - X coordinate to check
 * @param y - Y coordinate to check
 * @returns True if another robot occupies this position
 */
function isRobotAt(
  robots: Robots,
  excludeRobot: keyof Robots,
  x: number,
  y: number
): boolean {
  const robotColors: (keyof Robots)[] = ['red', 'yellow', 'green', 'blue'];
  
  for (const color of robotColors) {
    if (color === excludeRobot) continue;
    
    const robot = robots[color];
    if (robot.x === x && robot.y === y) {
      return true;
    }
  }
  
  return false;
}

/**
 * Applies a single move to the game state
 * 
 * @param robots - Current robot positions
 * @param walls - Wall configuration
 * @param move - The move to apply
 * @returns New robot positions after the move
 */
export function applyMove(
  robots: Robots,
  walls: Walls,
  move: Move
): Robots {
  const newRobots = cloneRobots(robots);
  const robotColor = move.robot as keyof Robots;
  
  newRobots[robotColor] = moveRobot(robots, walls, robotColor, move.direction);
  
  return newRobots;
}

/**
 * Applies a sequence of moves to the game state
 * 
 * @param initialRobots - Starting robot positions
 * @param walls - Wall configuration
 * @param moves - Array of moves to apply in order
 * @returns Final robot positions after all moves
 */
export function applyMoves(
  initialRobots: Robots,
  walls: Walls,
  moves: Move[]
): Robots {
  let robots = cloneRobots(initialRobots);
  
  for (const move of moves) {
    robots = applyMove(robots, walls, move);
  }
  
  return robots;
}

/**
 * Checks if two positions are equal
 * 
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns True if positions have same x and y coordinates
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Gets the position of a specific robot
 * 
 * @param robots - Robot positions
 * @param robotColor - Which robot's position to get
 * @returns Position of the specified robot
 */
export function getRobotPosition(
  robots: Robots,
  robotColor: keyof Robots
): Position {
  return { ...robots[robotColor] };
}

/**
 * Complete puzzle with walls, robots, and goals
 */
export interface Puzzle {
  walls: Walls;
  robots: Robots;
  goals: import('./types').Goal[];
}

/**
 * Generates random robot starting positions
 * Avoids the center 2×2 blocked area and goal positions
 * 
 * @param goalPositions - Set of goal positions to avoid
 * @returns Robot positions
 */
function generateRobotPositions(goalPositions: Set<string>): Robots {
  const occupied = new Set(goalPositions);
  
  // Center blocked area: (7,7), (7,8), (8,7), (8,8)
  occupied.add('7,7');
  occupied.add('7,8');
  occupied.add('8,7');
  occupied.add('8,8');
  
  const colors: (keyof Robots)[] = ['red', 'yellow', 'green', 'blue'];
  const robots: Partial<Robots> = {};
  
  for (const color of colors) {
    let position: Position;
    let posKey: string;
    
    do {
      position = {
        x: Math.floor(Math.random() * 16),
        y: Math.floor(Math.random() * 16)
      };
      posKey = `${position.x},${position.y}`;
    } while (occupied.has(posKey));
    
    robots[color] = position;
    occupied.add(posKey);
  }
  
  return robots as Robots;
}

/**
 * Generates a complete puzzle for a new game
 * Creates walls (center square + outer edges + 17 L-shapes with goals), and places 4 robots
 * 
 * Algorithm:
 * 1. Initialize empty walls structure
 * 2. Add center 2×2 blocking square
 * 3. Add 8 outer edge walls (2 per quadrant)
 * 4. Generate 17 goals with their L-shaped walls (16 single-color + 1 multi-color)
 * 5. Place robots randomly (avoiding center and goals)
 * 
 * @returns Complete puzzle ready for gameplay
 */
export function generatePuzzle(): Puzzle {
  // Step 1: Initialize empty walls structure
  const walls = initializeWalls();
  
  // Step 2: Add center 2×2 blocking square
  addCenterSquare(walls);
  
  // Step 3: Add 8 outer edge walls (2 per quadrant)
  addOuterEdgeWalls(walls);
  
  // Step 4: Generate 17 goals with their L-shaped walls
  // This adds 17 L-shapes (one per goal) to the walls structure
  const goalResult = generateAllGoals(walls);
  
  if (!goalResult.success) {
    throw new Error(`Failed to generate goals: ${goalResult.error}`);
  }
  
  // Step 5: Place robots randomly (avoiding center blocked area and goals)
  const goalPositions = new Set<string>(
    goalResult.goals.map((g: import('./types').Goal) => `${g.position.x},${g.position.y}`)
  );
  const robots = generateRobotPositions(goalPositions);
  
  return {
    walls,
    robots,
    goals: goalResult.goals
  };
}
