/**
 * Tests for shared/l-shape-utils.ts
 * Validates L-shaped wall placement, validation, and overlap detection
 */

import {
  getLShapeWallPositions,
  wallsOverlap,
  canPlaceLShape,
  addLShapeWall,
  isValidOrientation,
  getRandomOrientation,
  isValidLShapePosition,
  type LShape,
  type WallSegment,
  type LShapeOrientation
} from '../../shared/l-shape-utils';
import type { Walls } from '../../shared/types';

describe('getLShapeWallPositions', () => {
  test('returns correct walls for NW orientation', () => {
    const walls = getLShapeWallPositions({ x: 5, y: 5 }, 'NW');
    
    expect(walls).toHaveLength(2);
    expect(walls).toContainEqual({ type: 'horizontal', row: 4, col: 5 });
    expect(walls).toContainEqual({ type: 'vertical', col: 4, row: 5 });
  });

  test('returns correct walls for NE orientation', () => {
    const walls = getLShapeWallPositions({ x: 5, y: 5 }, 'NE');
    
    expect(walls).toHaveLength(2);
    expect(walls).toContainEqual({ type: 'horizontal', row: 4, col: 5 });
    expect(walls).toContainEqual({ type: 'vertical', col: 5, row: 5 });
  });

  test('returns correct walls for SW orientation', () => {
    const walls = getLShapeWallPositions({ x: 5, y: 5 }, 'SW');
    
    expect(walls).toHaveLength(2);
    expect(walls).toContainEqual({ type: 'horizontal', row: 5, col: 5 });
    expect(walls).toContainEqual({ type: 'vertical', col: 4, row: 5 });
  });

  test('returns correct walls for SE orientation', () => {
    const walls = getLShapeWallPositions({ x: 5, y: 5 }, 'SE');
    
    expect(walls).toHaveLength(2);
    expect(walls).toContainEqual({ type: 'horizontal', row: 5, col: 5 });
    expect(walls).toContainEqual({ type: 'vertical', col: 5, row: 5 });
  });

  test('handles position at (1, 1)', () => {
    const walls = getLShapeWallPositions({ x: 1, y: 1 }, 'NW');
    
    expect(walls).toContainEqual({ type: 'horizontal', row: 0, col: 1 });
    expect(walls).toContainEqual({ type: 'vertical', col: 0, row: 1 });
  });

  test('handles position at (14, 14)', () => {
    const walls = getLShapeWallPositions({ x: 14, y: 14 }, 'SE');
    
    expect(walls).toContainEqual({ type: 'horizontal', row: 14, col: 14 });
    expect(walls).toContainEqual({ type: 'vertical', col: 14, row: 14 });
  });
});

describe('wallsOverlap', () => {
  test('detects horizontal wall overlap', () => {
    const walls1: WallSegment[] = [
      { type: 'horizontal', row: 5, col: 7 }
    ];
    const walls2: WallSegment[] = [
      { type: 'horizontal', row: 5, col: 7 }
    ];
    
    expect(wallsOverlap(walls1, walls2)).toBe(true);
  });

  test('detects vertical wall overlap', () => {
    const walls1: WallSegment[] = [
      { type: 'vertical', col: 3, row: 8 }
    ];
    const walls2: WallSegment[] = [
      { type: 'vertical', col: 3, row: 8 }
    ];
    
    expect(wallsOverlap(walls1, walls2)).toBe(true);
  });

  test('returns false for different horizontal positions', () => {
    const walls1: WallSegment[] = [
      { type: 'horizontal', row: 5, col: 7 }
    ];
    const walls2: WallSegment[] = [
      { type: 'horizontal', row: 5, col: 8 }
    ];
    
    expect(wallsOverlap(walls1, walls2)).toBe(false);
  });

  test('returns false for different vertical positions', () => {
    const walls1: WallSegment[] = [
      { type: 'vertical', col: 3, row: 8 }
    ];
    const walls2: WallSegment[] = [
      { type: 'vertical', col: 3, row: 9 }
    ];
    
    expect(wallsOverlap(walls1, walls2)).toBe(false);
  });

  test('returns false for different wall types at same position', () => {
    const walls1: WallSegment[] = [
      { type: 'horizontal', row: 5, col: 7 }
    ];
    const walls2: WallSegment[] = [
      { type: 'vertical', col: 7, row: 5 }
    ];
    
    expect(wallsOverlap(walls1, walls2)).toBe(false);
  });

  test('returns false for empty wall arrays', () => {
    expect(wallsOverlap([], [])).toBe(false);
    expect(wallsOverlap([{ type: 'horizontal', row: 5, col: 7 }], [])).toBe(false);
    expect(wallsOverlap([], [{ type: 'vertical', col: 3, row: 8 }])).toBe(false);
  });

  test('detects overlap in multiple wall segments', () => {
    const walls1: WallSegment[] = [
      { type: 'horizontal', row: 5, col: 7 },
      { type: 'vertical', col: 3, row: 8 }
    ];
    const walls2: WallSegment[] = [
      { type: 'horizontal', row: 6, col: 7 },
      { type: 'vertical', col: 3, row: 8 }
    ];
    
    expect(wallsOverlap(walls1, walls2)).toBe(true);
  });
});

describe('canPlaceLShape', () => {
  test('allows placement when no existing L-shapes', () => {
    const result = canPlaceLShape({ x: 5, y: 5 }, 'NW', []);
    expect(result).toBe(true);
  });

  test('allows placement when no overlap with existing L-shapes', () => {
    const existing: LShape[] = [
      { position: { x: 3, y: 3 }, orientation: 'NW' }
    ];
    
    const result = canPlaceLShape({ x: 8, y: 8 }, 'SE', existing);
    expect(result).toBe(true);
  });

  test('rejects placement when horizontal wall overlaps', () => {
    const existing: LShape[] = [
      { position: { x: 5, y: 6 }, orientation: 'NW' } // Creates horizontal wall at row 5, col 5
    ];
    
    // Try to place L-shape that would create same horizontal wall
    const result = canPlaceLShape({ x: 5, y: 6 }, 'SW', existing);
    expect(result).toBe(false);
  });

  test('rejects placement when vertical wall overlaps', () => {
    const existing: LShape[] = [
      { position: { x: 6, y: 5 }, orientation: 'NW' } // Creates vertical wall at col 5, row 5
    ];
    
    // Try to place L-shape that would create same vertical wall
    const result = canPlaceLShape({ x: 6, y: 5 }, 'NE', existing);
    expect(result).toBe(false);
  });

  test('allows adjacent L-shapes that do not share walls', () => {
    const existing: LShape[] = [
      { position: { x: 5, y: 5 }, orientation: 'NW' }
      // Creates walls: horizontal at (4,5), vertical at (4,5)
    ];
    
    // Place L-shape next to it
    const result = canPlaceLShape({ x: 7, y: 5 }, 'NE', existing);
    expect(result).toBe(true);
  });

  test('handles multiple existing L-shapes', () => {
    const existing: LShape[] = [
      { position: { x: 3, y: 3 }, orientation: 'NW' },
      { position: { x: 8, y: 3 }, orientation: 'NE' },
      { position: { x: 3, y: 8 }, orientation: 'SW' }
    ];
    
    const result = canPlaceLShape({ x: 8, y: 8 }, 'SE', existing);
    expect(result).toBe(true);
  });

  test('rejects when overlapping with any of multiple existing L-shapes', () => {
    const existing: LShape[] = [
      { position: { x: 3, y: 3 }, orientation: 'NW' },
      { position: { x: 8, y: 8 }, orientation: 'SE' },  // Creates walls at row 8 col 8, and col 8 row 8
      { position: { x: 12, y: 12 }, orientation: 'NE' }
    ];
    
    // Try to overlap with the middle one by placing same orientation at same position
    const result = canPlaceLShape({ x: 8, y: 8 }, 'SE', existing);
    expect(result).toBe(false);
  });
});

describe('addLShapeWall', () => {
  let walls: Walls;

  beforeEach(() => {
    walls = {
      horizontal: Array(16).fill(null).map(() => []),
      vertical: Array(16).fill(null).map(() => [])
    };
  });

  test('adds walls for NW orientation', () => {
    addLShapeWall(walls, { x: 5, y: 5 }, 'NW');
    
    expect(walls.horizontal[4]).toContain(5);
    expect(walls.vertical[4]).toContain(5);
  });

  test('adds walls for NE orientation', () => {
    addLShapeWall(walls, { x: 5, y: 5 }, 'NE');
    
    expect(walls.horizontal[4]).toContain(5);
    expect(walls.vertical[5]).toContain(5);
  });

  test('adds walls for SW orientation', () => {
    addLShapeWall(walls, { x: 5, y: 5 }, 'SW');
    
    expect(walls.horizontal[5]).toContain(5);
    expect(walls.vertical[4]).toContain(5);
  });

  test('adds walls for SE orientation', () => {
    addLShapeWall(walls, { x: 5, y: 5 }, 'SE');
    
    expect(walls.horizontal[5]).toContain(5);
    expect(walls.vertical[5]).toContain(5);
  });

  test('does not add duplicate walls', () => {
    addLShapeWall(walls, { x: 5, y: 5 }, 'NW');
    addLShapeWall(walls, { x: 5, y: 5 }, 'NW');
    
    expect(walls.horizontal[4].filter(col => col === 5)).toHaveLength(1);
    expect(walls.vertical[4].filter(row => row === 5)).toHaveLength(1);
  });

  test('handles multiple L-shapes without duplication', () => {
    addLShapeWall(walls, { x: 3, y: 3 }, 'NW');
    addLShapeWall(walls, { x: 8, y: 8 }, 'SE');
    addLShapeWall(walls, { x: 12, y: 5 }, 'NE');
    
    expect(walls.horizontal[2]).toContain(3);
    expect(walls.horizontal[8]).toContain(8);
    expect(walls.horizontal[4]).toContain(12);
  });

  test('initializes array if undefined', () => {
    const sparseWalls: Walls = {
      horizontal: [],
      vertical: []
    };
    
    addLShapeWall(sparseWalls, { x: 10, y: 10 }, 'SE');
    
    expect(sparseWalls.horizontal[10]).toBeDefined();
    expect(sparseWalls.horizontal[10]).toContain(10);
    expect(sparseWalls.vertical[10]).toBeDefined();
    expect(sparseWalls.vertical[10]).toContain(10);
  });
});

describe('isValidOrientation', () => {
  test('returns true for valid orientations', () => {
    expect(isValidOrientation('NW')).toBe(true);
    expect(isValidOrientation('NE')).toBe(true);
    expect(isValidOrientation('SW')).toBe(true);
    expect(isValidOrientation('SE')).toBe(true);
  });

  test('returns false for invalid orientations', () => {
    expect(isValidOrientation('NORTH')).toBe(false);
    expect(isValidOrientation('invalid')).toBe(false);
    expect(isValidOrientation('')).toBe(false);
    expect(isValidOrientation(null)).toBe(false);
    expect(isValidOrientation(undefined)).toBe(false);
    expect(isValidOrientation(123)).toBe(false);
  });

  test('is case-sensitive', () => {
    expect(isValidOrientation('nw')).toBe(false);
    expect(isValidOrientation('Ne')).toBe(false);
  });
});

describe('getRandomOrientation', () => {
  test('returns valid orientation', () => {
    const orientation = getRandomOrientation();
    expect(isValidOrientation(orientation)).toBe(true);
  });

  test('returns one of four possible values', () => {
    const orientations = new Set<LShapeOrientation>();
    
    // Generate many random orientations
    for (let i = 0; i < 100; i++) {
      orientations.add(getRandomOrientation());
    }
    
    // Should eventually get all 4 (with very high probability)
    expect(orientations.size).toBeGreaterThan(1);
    
    // All should be valid
    orientations.forEach(o => {
      expect(['NW', 'NE', 'SW', 'SE']).toContain(o);
    });
  });
});

describe('isValidLShapePosition', () => {
  test('returns true for valid positions (default bounds)', () => {
    expect(isValidLShapePosition({ x: 1, y: 1 })).toBe(true);
    expect(isValidLShapePosition({ x: 7, y: 7 })).toBe(true);
    expect(isValidLShapePosition({ x: 14, y: 14 })).toBe(true);
    expect(isValidLShapePosition({ x: 5, y: 10 })).toBe(true);
  });

  test('returns false for positions on outer boundary', () => {
    expect(isValidLShapePosition({ x: 0, y: 5 })).toBe(false);
    expect(isValidLShapePosition({ x: 15, y: 5 })).toBe(false);
    expect(isValidLShapePosition({ x: 5, y: 0 })).toBe(false);
    expect(isValidLShapePosition({ x: 5, y: 15 })).toBe(false);
  });

  test('returns false for corner positions', () => {
    expect(isValidLShapePosition({ x: 0, y: 0 })).toBe(false);
    expect(isValidLShapePosition({ x: 15, y: 15 })).toBe(false);
    expect(isValidLShapePosition({ x: 0, y: 15 })).toBe(false);
    expect(isValidLShapePosition({ x: 15, y: 0 })).toBe(false);
  });

  test('respects custom bounds', () => {
    expect(isValidLShapePosition({ x: 3, y: 3 }, 2, 7, 2, 7)).toBe(true);
    expect(isValidLShapePosition({ x: 7, y: 7 }, 2, 7, 2, 7)).toBe(true);
    expect(isValidLShapePosition({ x: 1, y: 5 }, 2, 7, 2, 7)).toBe(false);
    expect(isValidLShapePosition({ x: 8, y: 5 }, 2, 7, 2, 7)).toBe(false);
  });

  test('validates quadrant boundaries', () => {
    // NW quadrant (1-7, 1-7)
    expect(isValidLShapePosition({ x: 4, y: 4 }, 1, 7, 1, 7)).toBe(true);
    expect(isValidLShapePosition({ x: 8, y: 4 }, 1, 7, 1, 7)).toBe(false);
    
    // SE quadrant (8-14, 8-14)
    expect(isValidLShapePosition({ x: 10, y: 10 }, 8, 14, 8, 14)).toBe(true);
    expect(isValidLShapePosition({ x: 7, y: 10 }, 8, 14, 8, 14)).toBe(false);
  });
});
