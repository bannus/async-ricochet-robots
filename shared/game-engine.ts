/**
 * Core game engine for Async Ricochet Robots
 * Handles robot movement, collision detection, and game state management
 */

import type { Position, Robots, Walls, Move, DirectionValue } from './types';
import { Direction, BOARD_SIZE, cloneRobots } from './types.js';
import { isWallBlocking } from './wall-utils.js';

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
 * Generates a complete puzzle for a new game
 * Creates 17 L-shaped wall pieces, places 4 robots, and generates 17 goals
 * 
 * @returns Complete puzzle ready for gameplay
 */
export function generatePuzzle(): Puzzle {
  const { generateWalls } = require('./l-shape-utils');
  const { generateAllGoals } = require('./goal-placement');
  
  // Generate 17 L-shaped wall pieces
  const walls = generateWalls();
  
  // Place robots in starting positions (center area, not overlapping)
  const robots: Robots = {
    red: { x: 7, y: 7 },
    yellow: { x: 8, y: 7 },
    green: { x: 7, y: 8 },
    blue: { x: 8, y: 8 }
  };
  
  // Generate 17 goals (4 per color + 1 multi)
  const goalResult = generateAllGoals(walls);
  
  return {
    walls,
    robots,
    goals: goalResult.goals
  };
}
