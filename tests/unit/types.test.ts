/**
 * Tests for shared/types.ts
 * Validates core type definitions, constants, and validation helpers
 */

import {
  RobotColor,
  Direction,
  GoalColor,
  ROBOT_COLORS,
  DIRECTIONS,
  BOARD_SIZE,
  GOAL_COLORS,
  isValidPosition,
  isValidRobotColor,
  isValidGoalColor,
  isValidDirection,
  isValidMove,
  cloneRobots,
  cloneWalls,
  type Position as _Position,
  type Robots,
  type Walls
} from '../../shared/types';

describe('Enums', () => {
  test('RobotColor enum contains exactly 4 colors', () => {
    expect(Object.keys(RobotColor).length).toBe(4);
    expect(RobotColor.Red).toBe('red');
    expect(RobotColor.Yellow).toBe('yellow');
    expect(RobotColor.Green).toBe('green');
    expect(RobotColor.Blue).toBe('blue');
  });

  test('Direction enum contains exactly 4 directions', () => {
    expect(Object.keys(Direction).length).toBe(4);
    expect(Direction.Up).toBe('up');
    expect(Direction.Down).toBe('down');
    expect(Direction.Left).toBe('left');
    expect(Direction.Right).toBe('right');
  });

  test('GoalColor enum contains robot colors plus multi', () => {
    expect(Object.keys(GoalColor).length).toBe(5);
    expect(GoalColor.Red).toBe('red');
    expect(GoalColor.Yellow).toBe('yellow');
    expect(GoalColor.Green).toBe('green');
    expect(GoalColor.Blue).toBe('blue');
    expect(GoalColor.Multi).toBe('multi');
  });
});

describe('Constants', () => {
  test('ROBOT_COLORS array contains exactly 4 colors', () => {
    expect(ROBOT_COLORS).toEqual(['red', 'yellow', 'green', 'blue']);
    expect(ROBOT_COLORS.length).toBe(4);
  });

  test('DIRECTIONS array contains exactly 4 directions', () => {
    expect(DIRECTIONS).toEqual(['up', 'down', 'left', 'right']);
    expect(DIRECTIONS.length).toBe(4);
  });

  test('BOARD_SIZE is 16', () => {
    expect(BOARD_SIZE).toBe(16);
  });

  test('GOAL_COLORS array contains robot colors plus multi', () => {
    expect(GOAL_COLORS).toEqual(['red', 'yellow', 'green', 'blue', 'multi']);
    expect(GOAL_COLORS.length).toBe(5);
  });
});

describe('isValidPosition', () => {
  test('accepts valid positions', () => {
    expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
    expect(isValidPosition({ x: 15, y: 15 })).toBe(true);
    expect(isValidPosition({ x: 7, y: 8 })).toBe(true);
    expect(isValidPosition({ x: 0, y: 15 })).toBe(true);
    expect(isValidPosition({ x: 15, y: 0 })).toBe(true);
  });

  test('rejects positions with negative coordinates', () => {
    expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
    expect(isValidPosition({ x: 0, y: -1 })).toBe(false);
    expect(isValidPosition({ x: -5, y: -5 })).toBe(false);
  });

  test('rejects positions beyond board bounds', () => {
    expect(isValidPosition({ x: 16, y: 0 })).toBe(false);
    expect(isValidPosition({ x: 0, y: 16 })).toBe(false);
    expect(isValidPosition({ x: 20, y: 20 })).toBe(false);
  });

  test('rejects non-integer coordinates', () => {
    expect(isValidPosition({ x: 5.5, y: 0 })).toBe(false);
    expect(isValidPosition({ x: 0, y: 7.3 })).toBe(false);
    expect(isValidPosition({ x: 3.14, y: 2.71 })).toBe(false);
  });

  test('rejects non-numeric coordinates', () => {
    expect(isValidPosition({ x: '5', y: 0 })).toBe(false);
    expect(isValidPosition({ x: 0, y: '7' })).toBe(false);
    expect(isValidPosition({ x: null, y: 0 })).toBe(false);
    expect(isValidPosition({ x: 0, y: undefined })).toBe(false);
  });

  test('rejects invalid objects', () => {
    expect(isValidPosition(null)).toBe(false);
    expect(isValidPosition(undefined)).toBe(false);
    expect(isValidPosition({})).toBe(false);
    expect(isValidPosition({ x: 5 })).toBe(false);
    expect(isValidPosition({ y: 5 })).toBe(false);
    expect(isValidPosition('position')).toBe(false);
    expect(isValidPosition(42)).toBe(false);
  });
});

describe('isValidRobotColor', () => {
  test('accepts valid robot colors', () => {
    expect(isValidRobotColor('red')).toBe(true);
    expect(isValidRobotColor('yellow')).toBe(true);
    expect(isValidRobotColor('green')).toBe(true);
    expect(isValidRobotColor('blue')).toBe(true);
  });

  test('rejects invalid colors', () => {
    expect(isValidRobotColor('multi')).toBe(false);
    expect(isValidRobotColor('purple')).toBe(false);
    expect(isValidRobotColor('Red')).toBe(false);
    expect(isValidRobotColor('BLUE')).toBe(false);
    expect(isValidRobotColor('')).toBe(false);
    expect(isValidRobotColor(null)).toBe(false);
    expect(isValidRobotColor(undefined)).toBe(false);
  });
});

describe('isValidGoalColor', () => {
  test('accepts valid goal colors including multi', () => {
    expect(isValidGoalColor('red')).toBe(true);
    expect(isValidGoalColor('yellow')).toBe(true);
    expect(isValidGoalColor('green')).toBe(true);
    expect(isValidGoalColor('blue')).toBe(true);
    expect(isValidGoalColor('multi')).toBe(true);
  });

  test('rejects invalid colors', () => {
    expect(isValidGoalColor('purple')).toBe(false);
    expect(isValidGoalColor('Multi')).toBe(false);
    expect(isValidGoalColor('')).toBe(false);
    expect(isValidGoalColor(null)).toBe(false);
    expect(isValidGoalColor(undefined)).toBe(false);
  });
});

describe('isValidDirection', () => {
  test('accepts valid directions', () => {
    expect(isValidDirection('up')).toBe(true);
    expect(isValidDirection('down')).toBe(true);
    expect(isValidDirection('left')).toBe(true);
    expect(isValidDirection('right')).toBe(true);
  });

  test('rejects invalid directions', () => {
    expect(isValidDirection('north')).toBe(false);
    expect(isValidDirection('Up')).toBe(false);
    expect(isValidDirection('LEFT')).toBe(false);
    expect(isValidDirection('')).toBe(false);
    expect(isValidDirection(null)).toBe(false);
    expect(isValidDirection(undefined)).toBe(false);
  });
});

describe('isValidMove', () => {
  test('accepts valid moves', () => {
    expect(isValidMove({ robot: 'red', direction: 'up' })).toBe(true);
    expect(isValidMove({ robot: 'blue', direction: 'left' })).toBe(true);
    expect(isValidMove({ robot: 'yellow', direction: 'down' })).toBe(true);
    expect(isValidMove({ robot: 'green', direction: 'right' })).toBe(true);
  });

  test('rejects moves with invalid robot', () => {
    expect(isValidMove({ robot: 'purple', direction: 'up' })).toBe(false);
    expect(isValidMove({ robot: 'multi', direction: 'up' })).toBe(false);
    expect(isValidMove({ robot: '', direction: 'up' })).toBe(false);
  });

  test('rejects moves with invalid direction', () => {
    expect(isValidMove({ robot: 'red', direction: 'north' })).toBe(false);
    expect(isValidMove({ robot: 'red', direction: 'Up' })).toBe(false);
    expect(isValidMove({ robot: 'red', direction: '' })).toBe(false);
  });

  test('rejects moves with missing properties', () => {
    expect(isValidMove({ robot: 'red' })).toBe(false);
    expect(isValidMove({ direction: 'up' })).toBe(false);
    expect(isValidMove({})).toBe(false);
  });

  test('rejects invalid move objects', () => {
    expect(isValidMove(null)).toBe(false);
    expect(isValidMove(undefined)).toBe(false);
    expect(isValidMove('move')).toBe(false);
    expect(isValidMove(42)).toBe(false);
  });
});

describe('cloneRobots', () => {
  test('creates deep copy of robots', () => {
    const original: Robots = {
      red: { x: 5, y: 7 },
      yellow: { x: 10, y: 3 },
      green: { x: 2, y: 14 },
      blue: { x: 15, y: 0 }
    };

    const cloned = cloneRobots(original);

    // Check all positions match
    expect(cloned.red).toEqual({ x: 5, y: 7 });
    expect(cloned.yellow).toEqual({ x: 10, y: 3 });
    expect(cloned.green).toEqual({ x: 2, y: 14 });
    expect(cloned.blue).toEqual({ x: 15, y: 0 });

    // Verify deep copy (modifying clone doesn't affect original)
    cloned.red.x = 99;
    expect(original.red.x).toBe(5);
  });

  test('creates independent objects', () => {
    const original: Robots = {
      red: { x: 1, y: 2 },
      yellow: { x: 3, y: 4 },
      green: { x: 5, y: 6 },
      blue: { x: 7, y: 8 }
    };

    const cloned = cloneRobots(original);

    // Verify each robot position is a different object
    expect(cloned.red).not.toBe(original.red);
    expect(cloned.yellow).not.toBe(original.yellow);
    expect(cloned.green).not.toBe(original.green);
    expect(cloned.blue).not.toBe(original.blue);
  });
});

describe('cloneWalls', () => {
  test('creates deep copy of walls structure', () => {
    const original: Walls = {
      horizontal: [
        [2, 5],
        [],
        [7, 9, 11],
        [1]
      ],
      vertical: [
        [3],
        [0, 5, 10],
        [],
        [8]
      ]
    };

    const cloned = cloneWalls(original);

    // Check structure matches
    expect(cloned.horizontal).toEqual(original.horizontal);
    expect(cloned.vertical).toEqual(original.vertical);

    // Verify deep copy (modifying clone doesn't affect original)
    cloned.horizontal[0].push(99);
    expect(original.horizontal[0]).toEqual([2, 5]);

    cloned.vertical[1].push(88);
    expect(original.vertical[1]).toEqual([0, 5, 10]);
  });

  test('handles empty wall arrays', () => {
    const original: Walls = {
      horizontal: [[], [], []],
      vertical: [[], [], []]
    };

    const cloned = cloneWalls(original);

    expect(cloned.horizontal).toEqual([[], [], []]);
    expect(cloned.vertical).toEqual([[], [], []]);
  });

  test('creates independent arrays', () => {
    const original: Walls = {
      horizontal: [[1, 2], [3, 4]],
      vertical: [[5, 6], [7, 8]]
    };

    const cloned = cloneWalls(original);

    // Verify arrays are different objects
    expect(cloned.horizontal).not.toBe(original.horizontal);
    expect(cloned.vertical).not.toBe(original.vertical);
    expect(cloned.horizontal[0]).not.toBe(original.horizontal[0]);
    expect(cloned.vertical[0]).not.toBe(original.vertical[0]);
  });
});
