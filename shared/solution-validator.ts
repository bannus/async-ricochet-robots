/**
 * Solution validation for Async Ricochet Robots
 * Validates that move sequences successfully reach goal positions
 */

import type { Robots, Walls, Move, Goal, Position, RobotColorValue } from './types';
import { isValidMove } from './types';
import { applyMoves, positionsEqual } from './game-engine';

/**
 * Result of solution validation
 */
export interface ValidationResult {
  /** Whether the solution is valid */
  valid: boolean;
  /** Reason for validation failure (if invalid) */
  reason?: string;
  /** Final robot positions after applying moves */
  finalPositions?: Robots;
  /** Which robot reached the goal (for multi-color goals) */
  winningRobot?: RobotColorValue;
}

/**
 * Validates a solution for a single-color goal
 * 
 * A solution is valid if:
 * 1. All moves are valid Move objects
 * 2. After applying all moves, the specified robot reaches the goal position
 * 
 * @param initialRobots - Starting robot positions
 * @param walls - Wall configuration
 * @param moves - Sequence of moves to validate
 * @param goal - Goal to reach
 * @returns Validation result with success/failure details
 * 
 * @example
 * const result = validateSolution(robots, walls, moves, goal);
 * if (result.valid) {
 *   console.log(`Solution valid! ${goal.color} reached goal in ${moves.length} moves`);
 * }
 */
export function validateSolution(
  initialRobots: Robots,
  walls: Walls,
  moves: Move[],
  goal: Goal
): ValidationResult {
  // Validate inputs
  if (!initialRobots || !walls || !moves || !goal) {
    return {
      valid: false,
      reason: 'Missing required parameters'
    };
  }

  // Validate goal has required properties
  if (!goal.position || !goal.color) {
    return {
      valid: false,
      reason: 'Goal must have position and color'
    };
  }

  // Validate all moves
  for (let i = 0; i < moves.length; i++) {
    if (!isValidMove(moves[i])) {
      return {
        valid: false,
        reason: `Invalid move at index ${i}`
      };
    }
  }

  // Apply all moves to get final state
  const finalPositions = applyMoves(initialRobots, walls, moves);

  // For single-color goals, check if the specified robot reached the goal
  if (goal.color !== 'multi') {
    const robotColor = goal.color as keyof Robots;
    const robotPosition = finalPositions[robotColor];

    if (positionsEqual(robotPosition, goal.position)) {
      return {
        valid: true,
        finalPositions,
        winningRobot: goal.color
      };
    } else {
      return {
        valid: false,
        reason: `Robot ${goal.color} did not reach goal position (${goal.position.x}, ${goal.position.y})`,
        finalPositions
      };
    }
  }

  // Multi-color goals handled separately (should not reach here in this function)
  return {
    valid: false,
    reason: 'Multi-color goals not supported by this function'
  };
}

/**
 * Validates a solution and returns the number of moves if valid
 * 
 * @param initialRobots - Starting robot positions
 * @param walls - Wall configuration
 * @param moves - Sequence of moves to validate
 * @param goal - Goal to reach
 * @returns Number of moves if valid, -1 if invalid
 */
export function getMoveCount(
  initialRobots: Robots,
  walls: Walls,
  moves: Move[],
  goal: Goal
): number {
  const result = validateSolution(initialRobots, walls, moves, goal);
  return result.valid ? moves.length : -1;
}

/**
 * Checks if a specific robot is at the goal position
 * 
 * @param robots - Current robot positions
 * @param robotColor - Which robot to check
 * @param goalPosition - Goal position
 * @returns True if robot is at goal
 */
export function isRobotAtGoal(
  robots: Robots,
  robotColor: keyof Robots,
  goalPosition: Position
): boolean {
  return positionsEqual(robots[robotColor], goalPosition);
}

/**
 * Finds which robot (if any) is at the goal position
 * 
 * @param robots - Current robot positions
 * @param goalPosition - Goal position
 * @returns Color of robot at goal, or null if none
 */
export function findRobotAtGoal(
  robots: Robots,
  goalPosition: Position
): RobotColorValue | null {
  const robotColors: (keyof Robots)[] = ['red', 'yellow', 'green', 'blue'];
  
  for (const color of robotColors) {
    if (positionsEqual(robots[color], goalPosition)) {
      return color;
    }
  }
  
  return null;
}
