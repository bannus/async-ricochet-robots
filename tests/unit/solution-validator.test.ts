/**
 * Tests for shared/solution-validator.ts
 * Validates solution validation logic for single-color goals
 */

import {
  validateSolution,
  getMoveCount,
  isRobotAtGoal,
  findRobotAtGoal,
  type ValidationResult as _ValidationResult
} from '../../shared/solution-validator';
import { Direction, type Robots, type Walls, type Move, type Goal } from '../../shared/types';

describe('validateSolution', () => {
  const emptyWalls: Walls = {
    horizontal: Array(16).fill([]),
    vertical: Array(16).fill([])
  };

  const initialRobots: Robots = {
    red: { x: 5, y: 5 },
    yellow: { x: 10, y: 10 },
    green: { x: 2, y: 2 },
    blue: { x: 13, y: 13 }
  };

  describe('Valid solutions', () => {
    test('validates correct single-move solution', () => {
      const goal: Goal = {
        position: { x: 5, y: 0 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('red');
      expect(result.finalPositions?.red).toEqual({ x: 5, y: 0 });
    });

    test('validates correct multi-move solution', () => {
      const goal: Goal = {
        position: { x: 15, y: 0 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up },
        { robot: 'red', direction: Direction.Right }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('red');
      expect(result.finalPositions?.red).toEqual({ x: 15, y: 0 });
    });

    test('validates solution for yellow robot', () => {
      const goal: Goal = {
        position: { x: 0, y: 10 },
        color: 'yellow'
      };

      const moves: Move[] = [
        { robot: 'yellow', direction: Direction.Left }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('yellow');
    });

    test('validates solution with helper robot moves', () => {
      const robots: Robots = {
        red: { x: 5, y: 5 },
        yellow: { x: 5, y: 8 },  // Blocking red's path down
        green: { x: 2, y: 2 },
        blue: { x: 13, y: 13 }
      };

      const goal: Goal = {
        position: { x: 5, y: 15 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'yellow', direction: Direction.Right },  // Move yellow out of the way
        { robot: 'red', direction: Direction.Down }        // Red can now reach goal
      ];

      const result = validateSolution(robots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('red');
      expect(result.finalPositions?.red).toEqual({ x: 5, y: 15 });
    });

    test('validates empty move sequence when robot already at goal', () => {
      const goal: Goal = {
        position: { x: 5, y: 5 },
        color: 'red'
      };

      const moves: Move[] = [];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('red');
    });
  });

  describe('Invalid solutions', () => {
    test('rejects solution where wrong robot reaches goal', () => {
      const goal: Goal = {
        position: { x: 5, y: 0 },
        color: 'yellow'  // Goal is for yellow, but red will reach this position
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('did not reach goal position');
    });

    test('rejects solution where robot does not reach goal', () => {
      const goal: Goal = {
        position: { x: 10, y: 10 },  // Red is at (5,5), goal far away
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }  // Red goes to (5,0)
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('did not reach goal position');
      expect(result.finalPositions?.red).toEqual({ x: 5, y: 0 });
    });

    test('rejects solution with invalid move', () => {
      const goal: Goal = {
        position: { x: 5, y: 0 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'invalid-robot', direction: Direction.Up } as any
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid move at index 0');
    });

    test('rejects solution with invalid direction', () => {
      const goal: Goal = {
        position: { x: 5, y: 0 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: 'invalid-direction' as any }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid move at index 0');
    });

    test('rejects solution with missing required parameters', () => {
      const goal: Goal = {
        position: { x: 5, y: 0 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];

      expect(validateSolution(null as any, emptyWalls, moves, goal).valid).toBe(false);
      expect(validateSolution(initialRobots, null as any, moves, goal).valid).toBe(false);
      expect(validateSolution(initialRobots, emptyWalls, null as any, goal).valid).toBe(false);
      expect(validateSolution(initialRobots, emptyWalls, moves, null as any).valid).toBe(false);
    });

    test('rejects goal without position', () => {
      const goal: Goal = {
        position: null as any,
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('must have position and color');
    });

    test('rejects goal without color', () => {
      const goal: Goal = {
        position: { x: 5, y: 0 },
        color: null as any
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('must have position and color');
    });

  });

  describe('Multi-color goals', () => {
    test('validates solution with red robot reaching multi-color goal', () => {
      const goal: Goal = {
        position: { x: 5, y: 0 },
        color: 'multi'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('red');
      expect(result.finalPositions?.red).toEqual({ x: 5, y: 0 });
    });

    test('validates solution with yellow robot reaching multi-color goal', () => {
      const goal: Goal = {
        position: { x: 0, y: 10 },
        color: 'multi'
      };

      const moves: Move[] = [
        { robot: 'yellow', direction: Direction.Left }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('yellow');
    });

    test('validates solution with any robot (green) reaching multi-color goal', () => {
      const goal: Goal = {
        position: { x: 0, y: 2 },
        color: 'multi'
      };

      const moves: Move[] = [
        { robot: 'green', direction: Direction.Left }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('green');
    });

    test('validates solution with blue robot reaching multi-color goal', () => {
      const goal: Goal = {
        position: { x: 15, y: 13 },
        color: 'multi'
      };

      const moves: Move[] = [
        { robot: 'blue', direction: Direction.Right }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('blue');
    });

    test('validates multi-move solution to reach multi-color goal', () => {
      const goal: Goal = {
        position: { x: 15, y: 15 },
        color: 'multi'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Down },
        { robot: 'red', direction: Direction.Right }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('red');
    });

    test('rejects solution where no robot reaches multi-color goal', () => {
      const goal: Goal = {
        position: { x: 7, y: 7 },  // No robot will be here
        color: 'multi'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }  // Red goes to (5,0)
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No robot reached goal position');
    });

    test('accepts first robot that reaches multi-color goal', () => {
      const robots: Robots = {
        red: { x: 8, y: 8 },
        yellow: { x: 8, y: 10 },
        green: { x: 2, y: 2 },
        blue: { x: 13, y: 13 }
      };

      const goal: Goal = {
        position: { x: 8, y: 0 },
        color: 'multi'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Up }  // Red reaches goal
      ];

      const result = validateSolution(robots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.winningRobot).toBe('red');
    });
  });

  describe('Complex scenarios', () => {
    const wallsConfig: Walls = {
      horizontal: [
        [],
        [],
        [5]  // Wall below row 2, column 5
      ],
      vertical: Array(16).fill([])
    };

    test('validates solution that stops at wall', () => {
      const robots: Robots = {
        red: { x: 5, y: 0 },
        yellow: { x: 10, y: 10 },
        green: { x: 2, y: 2 },
        blue: { x: 13, y: 13 }
      };

      const goal: Goal = {
        position: { x: 5, y: 2 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Down }
      ];

      const result = validateSolution(robots, wallsConfig, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.finalPositions?.red).toEqual({ x: 5, y: 2 });
    });

    test('validates long solution sequence', () => {
      const goal: Goal = {
        position: { x: 0, y: 15 },
        color: 'red'
      };

      const moves: Move[] = [
        { robot: 'red', direction: Direction.Down },
        { robot: 'red', direction: Direction.Left },
        { robot: 'red', direction: Direction.Down }
      ];

      const result = validateSolution(initialRobots, emptyWalls, moves, goal);

      expect(result.valid).toBe(true);
      expect(result.finalPositions?.red).toEqual({ x: 0, y: 15 });
    });
  });
});

describe('getMoveCount', () => {
  const emptyWalls: Walls = {
    horizontal: Array(16).fill([]),
    vertical: Array(16).fill([])
  };

  const initialRobots: Robots = {
    red: { x: 5, y: 5 },
    yellow: { x: 10, y: 10 },
    green: { x: 2, y: 2 },
    blue: { x: 13, y: 13 }
  };

  test('returns move count for valid solution', () => {
    const goal: Goal = {
      position: { x: 15, y: 0 },
      color: 'red'
    };

    const moves: Move[] = [
      { robot: 'red', direction: Direction.Up },
      { robot: 'red', direction: Direction.Right }
    ];

    expect(getMoveCount(initialRobots, emptyWalls, moves, goal)).toBe(2);
  });

  test('returns 0 for valid solution with no moves', () => {
    const goal: Goal = {
      position: { x: 5, y: 5 },
      color: 'red'
    };

    const moves: Move[] = [];

    expect(getMoveCount(initialRobots, emptyWalls, moves, goal)).toBe(0);
  });

  test('returns -1 for invalid solution', () => {
    const goal: Goal = {
      position: { x: 10, y: 10 },
      color: 'red'
    };

    const moves: Move[] = [
      { robot: 'red', direction: Direction.Up }
    ];

    expect(getMoveCount(initialRobots, emptyWalls, moves, goal)).toBe(-1);
  });

  test('returns correct count for longer solution', () => {
    const goal: Goal = {
      position: { x: 0, y: 0 },
      color: 'red'
    };

    const moves: Move[] = [
      { robot: 'red', direction: Direction.Up },
      { robot: 'red', direction: Direction.Left },
      { robot: 'red', direction: Direction.Up }
    ];

    expect(getMoveCount(initialRobots, emptyWalls, moves, goal)).toBe(3);
  });
});

describe('isRobotAtGoal', () => {
  const robots: Robots = {
    red: { x: 5, y: 7 },
    yellow: { x: 10, y: 3 },
    green: { x: 2, y: 14 },
    blue: { x: 15, y: 0 }
  };

  test('returns true when robot is at goal', () => {
    expect(isRobotAtGoal(robots, 'red', { x: 5, y: 7 })).toBe(true);
    expect(isRobotAtGoal(robots, 'yellow', { x: 10, y: 3 })).toBe(true);
    expect(isRobotAtGoal(robots, 'green', { x: 2, y: 14 })).toBe(true);
    expect(isRobotAtGoal(robots, 'blue', { x: 15, y: 0 })).toBe(true);
  });

  test('returns false when robot is not at goal', () => {
    expect(isRobotAtGoal(robots, 'red', { x: 5, y: 8 })).toBe(false);
    expect(isRobotAtGoal(robots, 'red', { x: 6, y: 7 })).toBe(false);
    expect(isRobotAtGoal(robots, 'yellow', { x: 0, y: 0 })).toBe(false);
  });

  test('returns false for different position with same x or y', () => {
    expect(isRobotAtGoal(robots, 'red', { x: 5, y: 10 })).toBe(false);
    expect(isRobotAtGoal(robots, 'red', { x: 10, y: 7 })).toBe(false);
  });
});

describe('findRobotAtGoal', () => {
  const robots: Robots = {
    red: { x: 5, y: 7 },
    yellow: { x: 10, y: 3 },
    green: { x: 2, y: 14 },
    blue: { x: 15, y: 0 }
  };

  test('finds robot at goal position', () => {
    expect(findRobotAtGoal(robots, { x: 5, y: 7 })).toBe('red');
    expect(findRobotAtGoal(robots, { x: 10, y: 3 })).toBe('yellow');
    expect(findRobotAtGoal(robots, { x: 2, y: 14 })).toBe('green');
    expect(findRobotAtGoal(robots, { x: 15, y: 0 })).toBe('blue');
  });

  test('returns null when no robot at goal', () => {
    expect(findRobotAtGoal(robots, { x: 0, y: 0 })).toBe(null);
    expect(findRobotAtGoal(robots, { x: 8, y: 8 })).toBe(null);
    expect(findRobotAtGoal(robots, { x: 15, y: 15 })).toBe(null);
  });

  test('returns first robot when multiple at same position (edge case)', () => {
    const overlappingRobots: Robots = {
      red: { x: 5, y: 5 },
      yellow: { x: 5, y: 5 },  // Should never happen in real game
      green: { x: 2, y: 2 },
      blue: { x: 13, y: 13 }
    };

    // Should return 'red' (first in iteration order)
    expect(findRobotAtGoal(overlappingRobots, { x: 5, y: 5 })).toBe('red');
  });
});
