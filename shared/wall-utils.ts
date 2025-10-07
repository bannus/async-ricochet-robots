/**
 * Wall collision detection utilities for Async Ricochet Robots
 * Handles checking if walls block robot movement in specific directions
 */

import type { Walls, DirectionValue } from './types';
import { Direction, BOARD_SIZE } from './types';

/**
 * Checks if a wall blocks movement from a specific position in a given direction
 * 
 * Wall format reference:
 * - walls.horizontal[row] = array of column indices with walls BELOW that row
 * - walls.vertical[col] = array of row indices with walls to the RIGHT of that column
 * 
 * @param walls - The walls structure
 * @param x - Current x position (column, 0-15)
 * @param y - Current y position (row, 0-15)
 * @param direction - Direction of attempted movement
 * @returns True if a wall blocks the movement, false otherwise
 * 
 * @example
 * // Check if wall blocks upward movement from (5, 7)
 * isWallBlocking(walls, 5, 7, 'up')
 */
export function isWallBlocking(
  walls: Walls,
  x: number,
  y: number,
  direction: DirectionValue
): boolean {
  // Validate inputs
  if (!walls || typeof x !== 'number' || typeof y !== 'number') {
    return false;
  }

  // Check bounds
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return false;
  }

  switch (direction) {
    case Direction.Up:
      // Moving up means crossing the horizontal wall above current position
      // Wall above = horizontal wall at row y-1
      if (y === 0) return false; // Already at top edge
      return walls.horizontal[y - 1]?.includes(x) ?? false;

    case Direction.Down:
      // Moving down means crossing the horizontal wall below current position
      // Wall below = horizontal wall at row y
      if (y === BOARD_SIZE - 1) return false; // Already at bottom edge
      return walls.horizontal[y]?.includes(x) ?? false;

    case Direction.Left:
      // Moving left means crossing the vertical wall to the left
      // Wall to left = vertical wall at column x-1
      if (x === 0) return false; // Already at left edge
      return walls.vertical[x - 1]?.includes(y) ?? false;

    case Direction.Right:
      // Moving right means crossing the vertical wall to the right
      // Wall to right = vertical wall at column x
      if (x === BOARD_SIZE - 1) return false; // Already at right edge
      return walls.vertical[x]?.includes(y) ?? false;

    default:
      return false;
  }
}

/**
 * Checks if a position is on the board boundary
 * 
 * @param x - X position (column)
 * @param y - Y position (row)
 * @returns True if position is on any edge of the board
 */
export function isOnBoundary(x: number, y: number): boolean {
  return x === 0 || x === BOARD_SIZE - 1 || y === 0 || y === BOARD_SIZE - 1;
}

/**
 * Gets the edge direction if position is on a boundary
 * 
 * @param x - X position (column)
 * @param y - Y position (row)
 * @returns Direction of the edge, or null if not on boundary
 */
export function getBoundaryDirection(x: number, y: number): DirectionValue | null {
  if (y === 0) return Direction.Up;
  if (y === BOARD_SIZE - 1) return Direction.Down;
  if (x === 0) return Direction.Left;
  if (x === BOARD_SIZE - 1) return Direction.Right;
  return null;
}
