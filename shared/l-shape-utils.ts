/**
 * L-Shape wall utilities for Async Ricochet Robots
 * Handles L-shaped wall placement, validation, and overlap detection
 */

import type { Position, Walls } from './types';

/**
 * L-shape orientation types
 * Each orientation represents which corner the walls form
 */
export type LShapeOrientation = 'NW' | 'NE' | 'SW' | 'SE';

/**
 * Represents an L-shaped wall placement
 */
export interface LShape {
  /** Position where the goal sits (in the corner of the L) */
  position: Position;
  /** Which corner the walls form */
  orientation: LShapeOrientation;
}

/**
 * Represents a wall segment (used for overlap detection)
 */
export interface WallSegment {
  /** Type of wall */
  type: 'horizontal' | 'vertical';
  /** Row index (for horizontal) or row position (for vertical) */
  row: number;
  /** Column index (for vertical) or column position (for horizontal) */
  col: number;
}

/**
 * Gets the wall positions that form an L-shape at the given position
 * 
 * L-shape orientations:
 * - NW (┏): walls on top and left
 * - NE (┓): walls on top and right
 * - SW (┗): walls on bottom and left
 * - SE (┛): walls on bottom and right
 * 
 * @param position - Where the goal sits (in the corner)
 * @param orientation - Which corner the walls form
 * @returns Array of wall segments that form the L-shape
 * 
 * @example
 * // Get walls for NW orientation at (5, 5)
 * const walls = getLShapeWallPositions({ x: 5, y: 5 }, 'NW');
 * // Returns: [
 * //   { type: 'horizontal', row: 4, col: 5 },  // Wall above
 * //   { type: 'vertical', col: 4, row: 5 }      // Wall to left
 * // ]
 */
export function getLShapeWallPositions(
  position: Position,
  orientation: LShapeOrientation
): WallSegment[] {
  const { x, y } = position;
  const walls: WallSegment[] = [];

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

/**
 * Checks if two sets of wall segments overlap
 * 
 * @param walls1 - First set of wall segments
 * @param walls2 - Second set of wall segments
 * @returns True if any wall segment overlaps
 */
export function wallsOverlap(walls1: WallSegment[], walls2: WallSegment[]): boolean {
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

/**
 * Checks if an L-shape can be placed without overlapping existing L-shapes
 * 
 * @param position - Proposed goal position
 * @param orientation - Proposed L-shape orientation
 * @param existingLShapes - Array of already-placed L-shapes
 * @returns True if L-shape can be placed without overlap
 */
export function canPlaceLShape(
  position: Position,
  orientation: LShapeOrientation,
  existingLShapes: LShape[]
): boolean {
  // Get the wall positions this L-shape would create
  const newWalls = getLShapeWallPositions(position, orientation);

  // Check against each existing L-shape
  for (const existing of existingLShapes) {
    const existingWalls = getLShapeWallPositions(existing.position, existing.orientation);

    // Check if any wall segment overlaps
    if (wallsOverlap(newWalls, existingWalls)) {
      return false;
    }
  }

  return true;
}

/**
 * Adds an L-shaped wall to the walls structure
 * 
 * @param walls - Walls structure to modify
 * @param position - Goal position (in the corner)
 * @param orientation - Which corner the walls form
 */
export function addLShapeWall(
  walls: Walls,
  position: Position,
  orientation: LShapeOrientation
): void {
  const { x, y } = position;

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

/**
 * Validates an L-shape orientation string
 * 
 * @param orientation - String to validate
 * @returns True if valid orientation
 */
export function isValidOrientation(orientation: any): orientation is LShapeOrientation {
  return ['NW', 'NE', 'SW', 'SE'].includes(orientation);
}

/**
 * Gets a random L-shape orientation
 * 
 * @returns Random orientation
 */
export function getRandomOrientation(): LShapeOrientation {
  const orientations: LShapeOrientation[] = ['NW', 'NE', 'SW', 'SE'];
  return orientations[Math.floor(Math.random() * orientations.length)];
}

/**
 * Checks if a position is valid for L-shape placement
 * (not on outer boundary, within board bounds)
 * 
 * @param position - Position to check
 * @param xMin - Minimum x coordinate (default 1)
 * @param xMax - Maximum x coordinate (default 14)
 * @param yMin - Minimum y coordinate (default 1)
 * @param yMax - Maximum y coordinate (default 14)
 * @returns True if position is valid
 */
export function isValidLShapePosition(
  position: Position,
  xMin: number = 1,
  xMax: number = 14,
  yMin: number = 1,
  yMax: number = 14
): boolean {
  return (
    position.x >= xMin &&
    position.x <= xMax &&
    position.y >= yMin &&
    position.y <= yMax
  );
}
