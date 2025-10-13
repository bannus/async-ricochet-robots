/**
 * L-Shape wall utilities for Async Ricochet Robots
 * Handles L-shaped wall placement, validation, and overlap detection
 */

import type { Position, Walls } from './types.js';

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
 * Checks if a wall exists at a specific position in the walls structure
 * 
 * @param walls - Walls structure to check
 * @param wallSegment - Wall segment to look for
 * @returns True if the wall exists
 */
export function hasWallAt(walls: Walls, wallSegment: WallSegment): boolean {
  if (wallSegment.type === 'horizontal') {
    const row = walls.horizontal[wallSegment.row];
    return row ? row.includes(wallSegment.col) : false;
  } else {
    const col = walls.vertical[wallSegment.col];
    return col ? col.includes(wallSegment.row) : false;
  }
}

/**
 * Gets all wall positions that would be directly adjacent to an L-shape
 * (i.e., walls that would touch this L-shape, including at corners)
 * 
 * @param position - L-shape position
 * @param orientation - L-shape orientation
 * @returns Array of wall segments that would be directly adjacent
 */
export function getAdjacentWallPositions(
  position: Position,
  orientation: LShapeOrientation
): WallSegment[] {
  const { x, y } = position;
  const adjacent: WallSegment[] = [];

  switch (orientation) {
    case 'NW': // ┏ - horizontal at (y-1, x), vertical at (x-1, y)
      // Walls that would touch the horizontal wall:
      adjacent.push({ type: 'horizontal', row: y - 1, col: x - 1 }); // Extends left
      adjacent.push({ type: 'horizontal', row: y - 1, col: x + 1 }); // Extends right
      
      // Walls that would touch the vertical wall:
      adjacent.push({ type: 'vertical', col: x - 1, row: y - 1 }); // Extends up
      adjacent.push({ type: 'vertical', col: x - 1, row: y + 1 }); // Extends down
      
      // Corner connection (both walls meet here):
      adjacent.push({ type: 'vertical', col: x, row: y - 1 }); // Perpendicular from horizontal
      adjacent.push({ type: 'horizontal', row: y, col: x - 1 }); // Perpendicular from vertical
      break;

    case 'NE': // ┓ - horizontal at (y-1, x), vertical at (x, y)
      // Horizontal wall adjacencies:
      adjacent.push({ type: 'horizontal', row: y - 1, col: x - 1 });
      adjacent.push({ type: 'horizontal', row: y - 1, col: x + 1 });
      
      // Vertical wall adjacencies:
      adjacent.push({ type: 'vertical', col: x, row: y - 1 });
      adjacent.push({ type: 'vertical', col: x, row: y + 1 });
      
      // Corner connections:
      adjacent.push({ type: 'vertical', col: x - 1, row: y - 1 });
      adjacent.push({ type: 'horizontal', row: y, col: x + 1 });
      break;

    case 'SW': // ┗ - horizontal at (y, x), vertical at (x-1, y)
      // Horizontal wall adjacencies:
      adjacent.push({ type: 'horizontal', row: y, col: x - 1 });
      adjacent.push({ type: 'horizontal', row: y, col: x + 1 });
      
      // Vertical wall adjacencies:
      adjacent.push({ type: 'vertical', col: x - 1, row: y - 1 });
      adjacent.push({ type: 'vertical', col: x - 1, row: y + 1 });
      
      // Corner connections:
      adjacent.push({ type: 'vertical', col: x, row: y + 1 });
      adjacent.push({ type: 'horizontal', row: y - 1, col: x - 1 });
      break;

    case 'SE': // ┛ - horizontal at (y, x), vertical at (x, y)
      // Horizontal wall adjacencies:
      adjacent.push({ type: 'horizontal', row: y, col: x - 1 });
      adjacent.push({ type: 'horizontal', row: y, col: x + 1 });
      
      // Vertical wall adjacencies:
      adjacent.push({ type: 'vertical', col: x, row: y - 1 });
      adjacent.push({ type: 'vertical', col: x, row: y + 1 });
      
      // Corner connections:
      adjacent.push({ type: 'vertical', col: x - 1, row: y + 1 });
      adjacent.push({ type: 'horizontal', row: y + 1, col: x + 1 });
      break;
  }

  // Remove duplicates and filter out invalid positions
  const uniqueAdjacent: WallSegment[] = [];
  const seen = new Set<string>();
  
  for (const wall of adjacent) {
    // Check bounds
    if (wall.type === 'horizontal') {
      if (wall.row < 0 || wall.row >= 16 || wall.col < 0 || wall.col >= 16) continue;
    } else {
      if (wall.col < 0 || wall.col >= 16 || wall.row < 0 || wall.row >= 16) continue;
    }
    
    const key = `${wall.type}-${wall.row}-${wall.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAdjacent.push(wall);
    }
  }
  
  return uniqueAdjacent;
}

/**
 * Checks if placing an L-shape would fully enclose the goal position
 * 
 * An L-shape creates 2 walls. If the other 2 walls already exist, the goal
 * would be trapped in a fully enclosed tile and unreachable.
 * 
 * @param position - Goal position
 * @param orientation - L-shape orientation
 * @param walls - Current walls structure
 * @returns True if the position would be fully enclosed
 */
function wouldBeFullyEnclosed(
  position: Position,
  orientation: LShapeOrientation,
  walls: Walls
): boolean {
  const { x, y } = position;
  
  // For each orientation, check if the 2 "completing" walls exist
  // that would trap the goal in a fully enclosed tile
  
  switch (orientation) {
    case 'NW': // ┏ - Creates top+left walls
      // Check if bottom+right walls exist (would complete the box)
      const bottomWall = hasWallAt(walls, { type: 'horizontal', row: y, col: x });
      const rightWall = hasWallAt(walls, { type: 'vertical', col: x, row: y });
      return bottomWall && rightWall;
      
    case 'NE': // ┓ - Creates top+right walls
      // Check if bottom+left walls exist
      const bottomWall2 = hasWallAt(walls, { type: 'horizontal', row: y, col: x });
      const leftWall = hasWallAt(walls, { type: 'vertical', col: x - 1, row: y });
      return bottomWall2 && leftWall;
      
    case 'SW': // ┗ - Creates bottom+left walls
      // Check if top+right walls exist
      const topWall = hasWallAt(walls, { type: 'horizontal', row: y - 1, col: x });
      const rightWall2 = hasWallAt(walls, { type: 'vertical', col: x, row: y });
      return topWall && rightWall2;
      
    case 'SE': // ┛ - Creates bottom+right walls
      // Check if top+left walls exist
      const topWall2 = hasWallAt(walls, { type: 'horizontal', row: y - 1, col: x });
      const leftWall2 = hasWallAt(walls, { type: 'vertical', col: x - 1, row: y });
      return topWall2 && leftWall2;
  }
}

/**
 * Checks if an L-shape can be placed without overlapping existing L-shapes,
 * being too close to other goals, or touching static walls
 * 
 * This function checks four conditions:
 * 1. Direct overlap: The new L-shape's walls don't overlap existing L-shape walls
 * 2. Minimum distance: The goal is not within a 3×3 box centered on any existing goal
 * 3. Static wall adjacency: The L-shape doesn't touch edge walls or center square
 * 4. Enclosure: The goal position won't be fully enclosed (trapped in a 4-walled tile)
 * 
 * @param position - Proposed goal position
 * @param orientation - Proposed L-shape orientation
 * @param existingLShapes - Array of already-placed L-shapes
 * @param walls - Current walls structure (includes center square and outer edge walls)
 * @returns True if L-shape can be placed
 */
export function canPlaceLShape(
  position: Position,
  orientation: LShapeOrientation,
  existingLShapes: LShape[],
  walls?: Walls
): boolean {
  // Get the wall positions this L-shape would create
  const newWalls = getLShapeWallPositions(position, orientation);

  // Check 1: Direct overlap - walls can't overlap existing L-shape walls
  for (const existing of existingLShapes) {
    const existingWalls = getLShapeWallPositions(existing.position, existing.orientation);

    // Check if any wall segment overlaps
    if (wallsOverlap(newWalls, existingWalls)) {
      return false;
    }
  }

  // Check 2: Minimum distance - goals can't be within a 3×3 box of each other
  // This prevents L-shapes from touching, forming continuous paths, or being too close
  for (const existing of existingLShapes) {
    const dx = Math.abs(position.x - existing.position.x);
    const dy = Math.abs(position.y - existing.position.y);
    
    // If within 3×3 box (distance of 1 or less in both dimensions)
    if (dx <= 1 && dy <= 1) {
      return false; // Goals are too close
    }
  }

  // If walls structure is provided, perform additional checks against static walls
  if (walls) {
    // Check 3: Static wall adjacency - L-shapes shouldn't touch edge walls or center square
    const adjacentPositions = getAdjacentWallPositions(position, orientation);
    
    for (const adjWall of adjacentPositions) {
      if (hasWallAt(walls, adjWall)) {
        return false; // Would touch a static wall (edge or center square)
      }
    }
    
    // Check 4: Enclosure - goal shouldn't be trapped in a fully enclosed tile
    if (wouldBeFullyEnclosed(position, orientation, walls)) {
      return false; // Goal would be unreachable in a fully enclosed tile
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

/**
 * Initializes an empty walls structure
 * 
 * @returns Empty walls structure with arrays for all 16 rows/columns
 */
export function initializeWalls(): Walls {
  const walls: Walls = {
    horizontal: Array(16).fill(null).map(() => []),
    vertical: Array(16).fill(null).map(() => [])
  };
  return walls;
}

/**
 * Adds the center 2×2 blocking square to walls
 * Blocks the 4 center tiles: (7,7), (7,8), (8,7), (8,8)
 * 
 * Creates walls AROUND the perimeter to prevent entry:
 * - Top wall: horizontal wall above row 7 (blocks downward into center)
 * - Bottom wall: horizontal wall below row 8 (blocks upward into center)
 * - Left wall: vertical wall left of col 7 (blocks rightward into center)
 * - Right wall: vertical wall right of col 8 (blocks leftward into center)
 * 
 * @param walls - Walls structure to modify
 */
export function addCenterSquare(walls: Walls): void {
  // Top edge of center square: horizontal wall ABOVE row 7 at columns 7-8
  walls.horizontal[6].push(7, 8);
  
  // Bottom edge of center square: horizontal wall BELOW row 8 at columns 7-8
  walls.horizontal[8].push(7, 8);
  
  // Left edge of center square: vertical wall LEFT of column 7 at rows 7-8
  walls.vertical[6].push(7, 8);
  
  // Right edge of center square: vertical wall RIGHT of column 8 at rows 7-8
  walls.vertical[8].push(7, 8);
}

/**
 * Adds 8 outer edge walls (2 per quadrant) to walls
 * Walls are PERPENDICULAR to the edges (stick out into the board)
 * Each wall is positioned 2-7 cells from the corner
 * 
 * Edge orientation:
 * - Top edge (row 0): VERTICAL walls at row 0 (perpendicular to edge)
 * - Bottom edge (row 15): VERTICAL walls at row 15 (perpendicular to edge)
 * - Left edge (col 0): HORIZONTAL walls at col 0 (perpendicular to edge)
 * - Right edge (col 15): HORIZONTAL walls at col 15 (perpendicular to edge)
 * 
 * @param walls - Walls structure to modify
 */
export function addOuterEdgeWalls(walls: Walls): void {
  // Helper to get random position in range 1-6 (2-7 tiles from left/top corner)
  const randomEdgePosLeft = () => Math.floor(Math.random() * 6) + 1; // 1-6
  
  // Helper to get random position in range 8-13 (2-7 tiles from right/bottom corner)
  const randomEdgePosRight = () => Math.floor(Math.random() * 6) + 8; // 8-13
  
  // NW quadrant: top edge (vertical wall) and left edge (horizontal wall)
  const nwTopCol = randomEdgePosLeft(); // Column 1-6
  const nwLeftRow = randomEdgePosLeft(); // Row 1-6
  // Top edge: vertical wall at row 0, sticking down into board
  walls.vertical[nwTopCol].push(0);
  // Left edge: horizontal wall at col 0, sticking right into board
  walls.horizontal[nwLeftRow].push(0);
  
  // NE quadrant: top edge (vertical wall) and right edge (horizontal wall)
  const neTopCol = randomEdgePosRight(); // Column 8-13
  const neRightRow = randomEdgePosLeft(); // Row 1-6
  // Top edge: vertical wall at row 0
  walls.vertical[neTopCol].push(0);
  // Right edge: horizontal wall at col 15
  walls.horizontal[neRightRow].push(15);
  
  // SW quadrant: bottom edge (vertical wall) and left edge (horizontal wall)
  const swBottomCol = randomEdgePosLeft(); // Column 1-6
  const swLeftRow = randomEdgePosRight(); // Row 8-13
  // Bottom edge: vertical wall at row 15
  walls.vertical[swBottomCol].push(15);
  // Left edge: horizontal wall at col 0
  walls.horizontal[swLeftRow].push(0);
  
  // SE quadrant: bottom edge (vertical wall) and right edge (horizontal wall)
  const seBottomCol = randomEdgePosRight(); // Column 8-13
  const seRightRow = randomEdgePosRight(); // Row 8-13
  // Bottom edge: vertical wall at row 15
  walls.vertical[seBottomCol].push(15);
  // Right edge: horizontal wall at col 15
  walls.horizontal[seRightRow].push(15);
}

/**
 * @deprecated Use initializeWalls() + addCenterSquare() + addOuterEdgeWalls() + goal placement instead
 * 
 * Generates 17 random L-shaped wall pieces for a new game
 * Places them randomly on the board without overlaps
 * 
 * NOTE: This function is deprecated because it generates orphaned L-shapes without goals.
 * The correct approach is to generate goals with their associated L-shapes.
 * 
 * @returns Walls structure with 17 L-shapes
 */
export function generateWalls(): Walls {
  const walls: Walls = {
    horizontal: [] as number[][],
    vertical: [] as number[][]
  };
  
  const lShapes: LShape[] = [];
  const maxAttempts = 1000;
  
  // Generate 17 L-shapes
  while (lShapes.length < 17) {
    let attempts = 0;
    let placed = false;
    
    while (!placed && attempts < maxAttempts) {
      // Random position (not on outer boundary)
      const x = Math.floor(Math.random() * 14) + 1; // 1-14
      const y = Math.floor(Math.random() * 14) + 1; // 1-14
      const position: Position = { x, y };
      
      // Random orientation
      const orientation = getRandomOrientation();
      
      // Check if can place
      if (canPlaceLShape(position, orientation, lShapes)) {
        // Add to tracking
        lShapes.push({ position, orientation });
        
        // Add walls to structure
        addLShapeWall(walls, position, orientation);
        
        placed = true;
      }
      
      attempts++;
    }
    
    if (!placed) {
      // This should rarely happen, but if it does, restart
      walls.horizontal = [] as number[][];
      walls.vertical = [] as number[][];
      lShapes.length = 0;
    }
  }
  
  return walls;
}
