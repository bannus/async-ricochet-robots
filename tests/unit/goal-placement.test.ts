/**
 * Tests for shared/goal-placement.ts
 * Validates goal generation and placement logic
 */

import {
  randomPositionInQuadrant,
  placeGoalInQuadrant,
  generateSingleColorGoals,
  generateMultiColorGoal,
  generateAllGoals,
  validateGoals,
  QUADRANTS,
  ROBOT_COLORS,
  type Quadrant
} from '../../shared/goal-placement';
import type { Walls, Goal } from '../../shared/types';
import type { LShape } from '../../shared/l-shape-utils';

describe('randomPositionInQuadrant', () => {
  test('generates position within quadrant bounds', () => {
    const quadrant: Quadrant = { name: 'NW', xMin: 1, xMax: 7, yMin: 1, yMax: 7 };
    
    for (let i = 0; i < 100; i++) {
      const pos = randomPositionInQuadrant(quadrant);
      expect(pos.x).toBeGreaterThanOrEqual(1);
      expect(pos.x).toBeLessThanOrEqual(7);
      expect(pos.y).toBeGreaterThanOrEqual(1);
      expect(pos.y).toBeLessThanOrEqual(7);
    }
  });

  test('generates varied positions', () => {
    const quadrant: Quadrant = { name: 'SE', xMin: 8, xMax: 14, yMin: 8, yMax: 14 };
    const positions = new Set<string>();
    
    for (let i = 0; i < 50; i++) {
      const pos = randomPositionInQuadrant(quadrant);
      positions.add(`${pos.x},${pos.y}`);
    }
    
    // Should generate multiple different positions
    expect(positions.size).toBeGreaterThan(10);
  });
});

describe('placeGoalInQuadrant', () => {
  const quadrant: Quadrant = { name: 'NW', xMin: 1, xMax: 7, yMin: 1, yMax: 7 };

  test('places goal with valid position and orientation', () => {
    const result = placeGoalInQuadrant(quadrant, 'red', []);
    
    expect(result).not.toBeNull();
    expect(result?.position.x).toBeGreaterThanOrEqual(1);
    expect(result?.position.x).toBeLessThanOrEqual(7);
    expect(result?.position.y).toBeGreaterThanOrEqual(1);
    expect(result?.position.y).toBeLessThanOrEqual(7);
    expect(['NW', 'NE', 'SW', 'SE']).toContain(result?.orientation);
  });

  test('avoids overlapping with existing L-shapes', () => {
    const existing: LShape[] = [
      { position: { x: 3, y: 3 }, orientation: 'NW' }
    ];
    
    const result = placeGoalInQuadrant(quadrant, 'yellow', existing);
    
    expect(result).not.toBeNull();
    // Should be different from existing
    expect(result?.position.x !== 3 || result?.position.y !== 3 || result?.orientation !== 'NW').toBe(true);
  });

  test('returns null when no valid placement after max attempts', () => {
    // Fill quadrant with many L-shapes (making it hard to place)
    const existing: LShape[] = [];
    for (let x = 1; x <= 7; x++) {
      for (let y = 1; y <= 7; y++) {
        existing.push({ position: { x, y }, orientation: 'NW' });
      }
    }
    
    const result = placeGoalInQuadrant(quadrant, 'blue', existing, 5);
    expect(result).toBeNull();
  });
});

describe('generateSingleColorGoals', () => {
  let walls: Walls;

  beforeEach(() => {
    walls = {
      horizontal: Array(16).fill(null).map(() => []),
      vertical: Array(16).fill(null).map(() => [])
    };
  });

  test('generates 16 goals (4 per quadrant)', () => {
    const result = generateSingleColorGoals(walls);
    
    expect(result.success).toBe(true);
    expect(result.goals).toHaveLength(16);
    expect(result.lShapes).toHaveLength(16);
  });

  test('generates 4 goals of each color', () => {
    const result = generateSingleColorGoals(walls);
    
    for (const color of ROBOT_COLORS) {
      const colorGoals = result.goals.filter(g => g.color === color);
      expect(colorGoals).toHaveLength(4);
    }
  });

  test('distributes goals across all 4 quadrants', () => {
    const result = generateSingleColorGoals(walls);
    
    const nwGoals = result.goals.filter(g => g.position.x <= 7 && g.position.y <= 7);
    const neGoals = result.goals.filter(g => g.position.x >= 8 && g.position.y <= 7);
    const swGoals = result.goals.filter(g => g.position.x <= 7 && g.position.y >= 8);
    const seGoals = result.goals.filter(g => g.position.x >= 8 && g.position.y >= 8);
    
    expect(nwGoals.length).toBe(4);
    expect(neGoals.length).toBe(4);
    expect(swGoals.length).toBe(4);
    expect(seGoals.length).toBe(4);
  });

  test('adds L-shaped walls to walls structure', () => {
    const result = generateSingleColorGoals(walls);
    
    expect(result.success).toBe(true);
    
    // Should have added walls
    let totalWalls = 0;
    walls.horizontal.forEach(row => totalWalls += row.length);
    walls.vertical.forEach(col => totalWalls += col.length);
    
    // 16 L-shapes × 2 walls each = 32 wall segments
    expect(totalWalls).toBe(32);
  });
});

describe('generateMultiColorGoal', () => {
  let walls: Walls;

  beforeEach(() => {
    walls = {
      horizontal: Array(16).fill(null).map(() => []),
      vertical: Array(16).fill(null).map(() => [])
    };
  });

  test('generates 1 multi-color goal', () => {
    const result = generateMultiColorGoal(walls, []);
    
    expect(result.success).toBe(true);
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].color).toBe('multi');
  });

  test('places goal in one of the four quadrants', () => {
    const result = generateMultiColorGoal(walls, []);
    
    expect(result.success).toBe(true);
    const goal = result.goals[0];
    
    // Should be in valid quadrant bounds (not on boundary)
    expect(goal.position.x).toBeGreaterThanOrEqual(1);
    expect(goal.position.x).toBeLessThanOrEqual(14);
    expect(goal.position.y).toBeGreaterThanOrEqual(1);
    expect(goal.position.y).toBeLessThanOrEqual(14);
  });

  test('avoids overlapping with existing L-shapes', () => {
    const existing: LShape[] = [
      { position: { x: 5, y: 5 }, orientation: 'SE' }
    ];
    
    const result = generateMultiColorGoal(walls, existing);
    
    expect(result.success).toBe(true);
    expect(result.lShapes).toHaveLength(1);
    
    // Should not be at same position with same orientation
    const lShape = result.lShapes[0];
    expect(lShape.position.x !== 5 || lShape.position.y !== 5 || lShape.orientation !== 'SE').toBe(true);
  });
});

describe('generateAllGoals', () => {
  let walls: Walls;

  beforeEach(() => {
    walls = {
      horizontal: Array(16).fill(null).map(() => []),
      vertical: Array(16).fill(null).map(() => [])
    };
  });

  test('generates exactly 17 goals', () => {
    const result = generateAllGoals(walls);
    
    expect(result.success).toBe(true);
    expect(result.goals).toHaveLength(17);
  });

  test('generates 16 single-color + 1 multi-color goal', () => {
    const result = generateAllGoals(walls);
    
    expect(result.success).toBe(true);
    
    const singleColorGoals = result.goals.filter(g => g.color !== 'multi');
    const multiColorGoals = result.goals.filter(g => g.color === 'multi');
    
    expect(singleColorGoals).toHaveLength(16);
    expect(multiColorGoals).toHaveLength(1);
  });

  test('all goals have unique positions', () => {
    const result = generateAllGoals(walls);
    
    expect(result.success).toBe(true);
    
    const positions = new Set<string>();
    for (const goal of result.goals) {
      const key = `${goal.position.x},${goal.position.y}`;
      positions.add(key);
    }
    
    // All 17 goals should have unique positions
    expect(positions.size).toBe(17);
  });

  test('creates 17 L-shapes', () => {
    const result = generateAllGoals(walls);
    
    expect(result.success).toBe(true);
    expect(result.lShapes).toHaveLength(17);
  });
});

describe('validateGoals', () => {
  test('validates correct goal set', () => {
    const goals: Goal[] = [];
    
    // Add 4 of each color with unique positions
    let posCounter = 0;
    for (const color of ROBOT_COLORS) {
      for (let i = 0; i < 4; i++) {
        goals.push({ position: { x: posCounter, y: 0 }, color });
        posCounter++;
      }
    }
    
    // Add 1 multi-color
    goals.push({ position: { x: posCounter, y: 0 }, color: 'multi' });
    
    const result = validateGoals(goals);
    expect(result.valid).toBe(true);
  });

  test('rejects incorrect number of goals', () => {
    const goals: Goal[] = [
      { position: { x: 1, y: 1 }, color: 'red' }
    ];
    
    const result = validateGoals(goals);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected 17 goals');
  });

  test('rejects incorrect number of multi-color goals', () => {
    const goals: Goal[] = [];
    
    // Add 16 single-color goals
    for (let i = 0; i < 16; i++) {
      goals.push({ position: { x: i, y: i }, color: 'red' });
    }
    
    // Add 1 more red instead of multi
    goals.push({ position: { x: 16, y: 16 }, color: 'red' });
    
    const result = validateGoals(goals);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('multi-color goal');
  });

  test('rejects incorrect color distribution', () => {
    const goals: Goal[] = [];
    
    // Add 5 red, 3 yellow, 4 green, 4 blue
    for (let i = 0; i < 5; i++) {
      goals.push({ position: { x: i, y: 0 }, color: 'red' });
    }
    for (let i = 0; i < 3; i++) {
      goals.push({ position: { x: i, y: 1 }, color: 'yellow' });
    }
    for (let i = 0; i < 4; i++) {
      goals.push({ position: { x: i, y: 2 }, color: 'green' });
    }
    for (let i = 0; i < 4; i++) {
      goals.push({ position: { x: i, y: 3 }, color: 'blue' });
    }
    goals.push({ position: { x: 0, y: 4 }, color: 'multi' });
    
    const result = validateGoals(goals);
    expect(result.valid).toBe(false);
  });

  test('rejects duplicate positions', () => {
    const goals: Goal[] = [];
    
    // Add 4 of each color
    for (const color of ROBOT_COLORS) {
      for (let i = 0; i < 4; i++) {
        goals.push({ position: { x: 5, y: 5 }, color }); // All same position
      }
    }
    goals.push({ position: { x: 5, y: 5 }, color: 'multi' });
    
    const result = validateGoals(goals);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Duplicate goal position');
  });
});

describe('QUADRANTS constant', () => {
  test('defines 4 quadrants', () => {
    expect(QUADRANTS).toHaveLength(4);
  });

  test('quadrants have correct names', () => {
    const names = QUADRANTS.map(q => q.name);
    expect(names).toContain('NW');
    expect(names).toContain('NE');
    expect(names).toContain('SW');
    expect(names).toContain('SE');
  });

  test('quadrants exclude outer boundary', () => {
    for (const quadrant of QUADRANTS) {
      expect(quadrant.xMin).toBeGreaterThanOrEqual(1);
      expect(quadrant.xMax).toBeLessThanOrEqual(14);
      expect(quadrant.yMin).toBeGreaterThanOrEqual(1);
      expect(quadrant.yMax).toBeLessThanOrEqual(14);
    }
  });
});

describe('ROBOT_COLORS constant', () => {
  test('defines 4 robot colors', () => {
    expect(ROBOT_COLORS).toHaveLength(4);
  });

  test('includes all standard colors', () => {
    expect(ROBOT_COLORS).toContain('red');
    expect(ROBOT_COLORS).toContain('yellow');
    expect(ROBOT_COLORS).toContain('green');
    expect(ROBOT_COLORS).toContain('blue');
  });
});
