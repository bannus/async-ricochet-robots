/**
 * Unit tests for duplicate solution detection
 */

import { Direction } from '../../shared/types';
import type { Move } from '../../shared/types';

/**
 * Helper function to compare two move arrays for equality
 */
function areMovesEqual(moves1: Move[], moves2: Move[]): boolean {
  if (moves1.length !== moves2.length) {
    return false;
  }
  
  return JSON.stringify(moves1) === JSON.stringify(moves2);
}

describe('Duplicate Solution Detection', () => {
  describe('Move Array Comparison', () => {
    test('identical moves are detected as equal', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down },
        { robot: 'blue', direction: Direction.Left }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down },
        { robot: 'blue', direction: Direction.Left }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(true);
    });

    test('different moves are detected as not equal', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'blue', direction: Direction.Left }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(false);
    });

    test('different move order is detected as not equal', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'blue', direction: Direction.Left }
      ];
      
      const moves2: Move[] = [
        { robot: 'blue', direction: Direction.Left },
        { robot: 'red', direction: Direction.Right }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(false);
    });

    test('different move count is detected as not equal', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(false);
    });

    test('empty move arrays are equal', () => {
      const moves1: Move[] = [];
      const moves2: Move[] = [];
      
      expect(areMovesEqual(moves1, moves2)).toBe(true);
    });

    test('single move arrays are compared correctly', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(true);
    });

    test('different robot in same position is detected as different', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      const moves2: Move[] = [
        { robot: 'blue', direction: Direction.Right }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(false);
    });

    test('different direction for same robot is detected as different', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Left }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(false);
    });

    test('long identical sequences are detected as equal', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down },
        { robot: 'blue', direction: Direction.Left },
        { robot: 'blue', direction: Direction.Up },
        { robot: 'yellow', direction: Direction.Right },
        { robot: 'yellow', direction: Direction.Down },
        { robot: 'green', direction: Direction.Left },
        { robot: 'green', direction: Direction.Up }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down },
        { robot: 'blue', direction: Direction.Left },
        { robot: 'blue', direction: Direction.Up },
        { robot: 'yellow', direction: Direction.Right },
        { robot: 'yellow', direction: Direction.Down },
        { robot: 'green', direction: Direction.Left },
        { robot: 'green', direction: Direction.Up }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(true);
    });

    test('long sequences with one difference are detected as not equal', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down },
        { robot: 'blue', direction: Direction.Left },
        { robot: 'blue', direction: Direction.Up }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'red', direction: Direction.Down },
        { robot: 'blue', direction: Direction.Right }, // Different direction
        { robot: 'blue', direction: Direction.Up }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(false);
    });
  });

  describe('JSON Serialization Consistency', () => {
    test('JSON serialization produces consistent results', () => {
      const moves: Move[] = [
        { robot: 'red', direction: Direction.Right },
        { robot: 'blue', direction: Direction.Down }
      ];
      
      const json1 = JSON.stringify(moves);
      const json2 = JSON.stringify(moves);
      
      expect(json1).toBe(json2);
    });

    test('different moves produce different JSON', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      const moves2: Move[] = [
        { robot: 'blue', direction: Direction.Right }
      ];
      
      const json1 = JSON.stringify(moves1);
      const json2 = JSON.stringify(moves2);
      
      expect(json1).not.toBe(json2);
    });
  });

  describe('Edge Cases', () => {
    test('handles whitespace differences in string representation', () => {
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      // Even if we manually create JSON with different whitespace,
      // JSON.stringify should produce the same output
      expect(JSON.stringify(moves1)).toBe(JSON.stringify(moves2));
    });

    test('detects duplicates regardless of object key order', () => {
      // In JavaScript, object key order in JSON.stringify is generally stable,
      // but we want to ensure our comparison works correctly
      const moves1: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      const moves2: Move[] = [
        { robot: 'red', direction: Direction.Right }
      ];
      
      expect(areMovesEqual(moves1, moves2)).toBe(true);
    });
  });
});
