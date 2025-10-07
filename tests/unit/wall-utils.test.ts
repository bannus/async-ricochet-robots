/**
 * Tests for shared/wall-utils.ts
 * Validates wall collision detection logic
 */

import {
  isWallBlocking,
  isOnBoundary,
  getBoundaryDirection
} from '../../shared/wall-utils';
import { Direction, type Walls } from '../../shared/types';

describe('isWallBlocking', () => {
  describe('Horizontal walls (block up/down movement)', () => {
    const walls: Walls = {
      horizontal: [
        [],           // Row 0: no walls below
        [5, 7],       // Row 1: walls below at columns 5 and 7
        [],           // Row 2: no walls below
        [3, 10, 12],  // Row 3: walls below at columns 3, 10, 12
        [0, 15]       // Row 4: walls at edges
      ],
      vertical: Array(16).fill([])
    };

    test('blocks upward movement when wall exists above', () => {
      // Moving up from (5, 2) crosses wall at horizontal[1][5]
      expect(isWallBlocking(walls, 5, 2, Direction.Up)).toBe(true);
      expect(isWallBlocking(walls, 7, 2, Direction.Up)).toBe(true);
    });

    test('allows upward movement when no wall above', () => {
      expect(isWallBlocking(walls, 6, 2, Direction.Up)).toBe(false);
      expect(isWallBlocking(walls, 0, 2, Direction.Up)).toBe(false);
    });

    test('blocks downward movement when wall exists below', () => {
      // Moving down from (5, 1) crosses wall at horizontal[1][5]
      expect(isWallBlocking(walls, 5, 1, Direction.Down)).toBe(true);
      expect(isWallBlocking(walls, 7, 1, Direction.Down)).toBe(true);
    });

    test('allows downward movement when no wall below', () => {
      expect(isWallBlocking(walls, 6, 1, Direction.Down)).toBe(false);
      expect(isWallBlocking(walls, 0, 1, Direction.Down)).toBe(false);
    });

    test('handles walls at board edges', () => {
      expect(isWallBlocking(walls, 0, 4, Direction.Down)).toBe(true);
      expect(isWallBlocking(walls, 15, 4, Direction.Down)).toBe(true);
    });
  });

  describe('Vertical walls (block left/right movement)', () => {
    const walls: Walls = {
      horizontal: Array(16).fill([]),
      vertical: [
        [],           // Col 0: no walls to right
        [3, 8],       // Col 1: walls to right at rows 3 and 8
        [],           // Col 2: no walls to right
        [5, 12, 14],  // Col 3: walls to right at rows 5, 12, 14
        [0, 15]       // Col 4: walls at edges
      ]
    };

    test('blocks rightward movement when wall exists to right', () => {
      // Moving right from (1, 3) crosses wall at vertical[1][3]
      expect(isWallBlocking(walls, 1, 3, Direction.Right)).toBe(true);
      expect(isWallBlocking(walls, 1, 8, Direction.Right)).toBe(true);
    });

    test('allows rightward movement when no wall to right', () => {
      expect(isWallBlocking(walls, 1, 4, Direction.Right)).toBe(false);
      expect(isWallBlocking(walls, 1, 0, Direction.Right)).toBe(false);
    });

    test('blocks leftward movement when wall exists to left', () => {
      // Moving left from (2, 3) crosses wall at vertical[1][3]
      expect(isWallBlocking(walls, 2, 3, Direction.Left)).toBe(true);
      expect(isWallBlocking(walls, 2, 8, Direction.Left)).toBe(true);
    });

    test('allows leftward movement when no wall to left', () => {
      expect(isWallBlocking(walls, 2, 4, Direction.Left)).toBe(false);
      expect(isWallBlocking(walls, 2, 0, Direction.Left)).toBe(false);
    });

    test('handles walls at board edges', () => {
      expect(isWallBlocking(walls, 4, 0, Direction.Right)).toBe(true);
      expect(isWallBlocking(walls, 4, 15, Direction.Right)).toBe(true);
    });
  });

  describe('Board boundaries', () => {
    const emptyWalls: Walls = {
      horizontal: Array(16).fill([]),
      vertical: Array(16).fill([])
    };

    test('returns false when already at top edge (cannot move up)', () => {
      expect(isWallBlocking(emptyWalls, 5, 0, Direction.Up)).toBe(false);
      expect(isWallBlocking(emptyWalls, 0, 0, Direction.Up)).toBe(false);
      expect(isWallBlocking(emptyWalls, 15, 0, Direction.Up)).toBe(false);
    });

    test('returns false when already at bottom edge (cannot move down)', () => {
      expect(isWallBlocking(emptyWalls, 5, 15, Direction.Down)).toBe(false);
      expect(isWallBlocking(emptyWalls, 0, 15, Direction.Down)).toBe(false);
      expect(isWallBlocking(emptyWalls, 15, 15, Direction.Down)).toBe(false);
    });

    test('returns false when already at left edge (cannot move left)', () => {
      expect(isWallBlocking(emptyWalls, 0, 5, Direction.Left)).toBe(false);
      expect(isWallBlocking(emptyWalls, 0, 0, Direction.Left)).toBe(false);
      expect(isWallBlocking(emptyWalls, 0, 15, Direction.Left)).toBe(false);
    });

    test('returns false when already at right edge (cannot move right)', () => {
      expect(isWallBlocking(emptyWalls, 15, 5, Direction.Right)).toBe(false);
      expect(isWallBlocking(emptyWalls, 15, 0, Direction.Right)).toBe(false);
      expect(isWallBlocking(emptyWalls, 15, 15, Direction.Right)).toBe(false);
    });
  });

  describe('Empty walls', () => {
    const emptyWalls: Walls = {
      horizontal: Array(16).fill([]),
      vertical: Array(16).fill([])
    };

    test('allows movement in all directions when no walls exist', () => {
      expect(isWallBlocking(emptyWalls, 5, 5, Direction.Up)).toBe(false);
      expect(isWallBlocking(emptyWalls, 5, 5, Direction.Down)).toBe(false);
      expect(isWallBlocking(emptyWalls, 5, 5, Direction.Left)).toBe(false);
      expect(isWallBlocking(emptyWalls, 5, 5, Direction.Right)).toBe(false);
    });
  });

  describe('Invalid inputs', () => {
    const walls: Walls = {
      horizontal: [[5]],
      vertical: [[3]]
    };

    test('returns false for out-of-bounds positions', () => {
      expect(isWallBlocking(walls, -1, 5, Direction.Up)).toBe(false);
      expect(isWallBlocking(walls, 5, -1, Direction.Up)).toBe(false);
      expect(isWallBlocking(walls, 16, 5, Direction.Up)).toBe(false);
      expect(isWallBlocking(walls, 5, 16, Direction.Up)).toBe(false);
    });

    test('returns false for null/undefined walls', () => {
      expect(isWallBlocking(null as any, 5, 5, Direction.Up)).toBe(false);
      expect(isWallBlocking(undefined as any, 5, 5, Direction.Up)).toBe(false);
    });

    test('returns false for non-numeric coordinates', () => {
      expect(isWallBlocking(walls, '5' as any, 5, Direction.Up)).toBe(false);
      expect(isWallBlocking(walls, 5, '5' as any, Direction.Up)).toBe(false);
    });

    test('handles undefined arrays in walls structure', () => {
      const sparseWalls: Walls = {
        horizontal: [],
        vertical: []
      };
      expect(isWallBlocking(sparseWalls, 5, 5, Direction.Up)).toBe(false);
      expect(isWallBlocking(sparseWalls, 5, 5, Direction.Right)).toBe(false);
    });

    test('returns false for invalid direction', () => {
      expect(isWallBlocking(walls, 5, 5, 'invalid' as any)).toBe(false);
    });
  });

  describe('Complex wall scenarios', () => {
    const complexWalls: Walls = {
      horizontal: [
        [0, 1, 2, 3, 4, 5],  // Row 0: wall along bottom
        [],
        [7, 8, 9],           // Row 2: partial wall
        [],
        [10]                 // Row 4: single wall
      ],
      vertical: [
        [0, 1, 2],           // Col 0: wall along right side
        [],
        [5, 6],              // Col 2: partial wall
        [],
        [12, 13, 14, 15]     // Col 4: wall along right side
      ]
    };

    test('correctly identifies blocking walls in complex scenarios', () => {
      // Horizontal wall at row 0 blocks down from (3, 0)
      expect(isWallBlocking(complexWalls, 3, 0, Direction.Down)).toBe(true);
      
      // Horizontal wall at row 2 blocks up from (8, 3)
      expect(isWallBlocking(complexWalls, 8, 3, Direction.Up)).toBe(true);
      
      // Vertical wall at col 0 blocks right from (0, 1)
      expect(isWallBlocking(complexWalls, 0, 1, Direction.Right)).toBe(true);
      
      // Vertical wall at col 2 blocks left from (3, 5)
      expect(isWallBlocking(complexWalls, 3, 5, Direction.Left)).toBe(true);
    });

    test('correctly allows movement where no walls exist', () => {
      expect(isWallBlocking(complexWalls, 6, 3, Direction.Up)).toBe(false);
      expect(isWallBlocking(complexWalls, 1, 5, Direction.Right)).toBe(false);
    });
  });
});

describe('isOnBoundary', () => {
  test('returns true for top edge positions', () => {
    expect(isOnBoundary(0, 0)).toBe(true);
    expect(isOnBoundary(5, 0)).toBe(true);
    expect(isOnBoundary(15, 0)).toBe(true);
  });

  test('returns true for bottom edge positions', () => {
    expect(isOnBoundary(0, 15)).toBe(true);
    expect(isOnBoundary(5, 15)).toBe(true);
    expect(isOnBoundary(15, 15)).toBe(true);
  });

  test('returns true for left edge positions', () => {
    expect(isOnBoundary(0, 0)).toBe(true);
    expect(isOnBoundary(0, 5)).toBe(true);
    expect(isOnBoundary(0, 15)).toBe(true);
  });

  test('returns true for right edge positions', () => {
    expect(isOnBoundary(15, 0)).toBe(true);
    expect(isOnBoundary(15, 5)).toBe(true);
    expect(isOnBoundary(15, 15)).toBe(true);
  });

  test('returns false for interior positions', () => {
    expect(isOnBoundary(1, 1)).toBe(false);
    expect(isOnBoundary(5, 5)).toBe(false);
    expect(isOnBoundary(14, 14)).toBe(false);
    expect(isOnBoundary(7, 8)).toBe(false);
  });
});

describe('getBoundaryDirection', () => {
  test('returns "up" for top edge', () => {
    expect(getBoundaryDirection(0, 0)).toBe(Direction.Up);
    expect(getBoundaryDirection(5, 0)).toBe(Direction.Up);
    expect(getBoundaryDirection(15, 0)).toBe(Direction.Up);
  });

  test('returns "down" for bottom edge', () => {
    expect(getBoundaryDirection(5, 15)).toBe(Direction.Down);
    expect(getBoundaryDirection(0, 15)).toBe(Direction.Down);
    expect(getBoundaryDirection(15, 15)).toBe(Direction.Down);
  });

  test('returns "left" for left edge (not corners)', () => {
    expect(getBoundaryDirection(0, 5)).toBe(Direction.Left);
    expect(getBoundaryDirection(0, 7)).toBe(Direction.Left);
  });

  test('returns "right" for right edge (not corners)', () => {
    expect(getBoundaryDirection(15, 5)).toBe(Direction.Right);
    expect(getBoundaryDirection(15, 7)).toBe(Direction.Right);
  });

  test('returns null for interior positions', () => {
    expect(getBoundaryDirection(1, 1)).toBe(null);
    expect(getBoundaryDirection(5, 5)).toBe(null);
    expect(getBoundaryDirection(14, 14)).toBe(null);
    expect(getBoundaryDirection(7, 8)).toBe(null);
  });

  test('prioritizes vertical edges for corners', () => {
    // Top-left corner: returns "up" (y === 0 checked first)
    expect(getBoundaryDirection(0, 0)).toBe(Direction.Up);
    
    // Top-right corner: returns "up"
    expect(getBoundaryDirection(15, 0)).toBe(Direction.Up);
    
    // Bottom-left corner: returns "down"
    expect(getBoundaryDirection(0, 15)).toBe(Direction.Down);
    
    // Bottom-right corner: returns "down"
    expect(getBoundaryDirection(15, 15)).toBe(Direction.Down);
  });
});
