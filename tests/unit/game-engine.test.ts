/**
 * Tests for shared/game-engine.ts
 * Validates robot movement, collision detection, and game state management
 */

import {
  moveRobot,
  applyMove,
  applyMoves,
  positionsEqual,
  getRobotPosition
} from '../../shared/game-engine';
import { Direction, type Robots, type Walls, type Move } from '../../shared/types';

describe('moveRobot', () => {
  describe('Movement on empty board', () => {
    const emptyWalls: Walls = {
      horizontal: Array(16).fill([]),
      vertical: Array(16).fill([])
    };

    const robots: Robots = {
      red: { x: 8, y: 8 },
      yellow: { x: 2, y: 2 },
      green: { x: 14, y: 14 },
      blue: { x: 1, y: 1 }
    };

    test('slides upward to top edge', () => {
      const result = moveRobot(robots, emptyWalls, 'red', Direction.Up);
      expect(result).toEqual({ x: 8, y: 0 });
    });

    test('slides downward to bottom edge', () => {
      const result = moveRobot(robots, emptyWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 8, y: 15 });
    });

    test('slides leftward to left edge', () => {
      const result = moveRobot(robots, emptyWalls, 'red', Direction.Left);
      expect(result).toEqual({ x: 0, y: 8 });
    });

    test('slides rightward to right edge', () => {
      const result = moveRobot(robots, emptyWalls, 'red', Direction.Right);
      expect(result).toEqual({ x: 15, y: 8 });
    });

    test('robot already at edge stays in place', () => {
      const result = moveRobot(robots, emptyWalls, 'yellow', Direction.Up);
      expect(result).toEqual({ x: 2, y: 0 });
    });
  });

  describe('Movement with walls', () => {
    const wallsConfig: Walls = {
      horizontal: [
        [],
        [],
        [],
        [],
        [8],        // Wall below row 4, column 8 (blocks downward from (8,4))
        [],
        [],
        [8]         // Wall below row 7, column 8 (blocks downward from (8,7))
      ],
      vertical: [
        [],
        [],
        [],
        [],
        [8],        // Wall right of column 4, row 8 (blocks rightward from (4,8))
        [],
        [],
        [8]         // Wall right of column 7, row 8 (blocks rightward from (7,8))
      ]
    };

    const robots: Robots = {
      red: { x: 8, y: 6 },
      yellow: { x: 6, y: 8 },
      green: { x: 10, y: 10 },
      blue: { x: 0, y: 0 }
    };

    test('stops at wall when moving down', () => {
      const result = moveRobot(robots, wallsConfig, 'red', Direction.Down);
      expect(result).toEqual({ x: 8, y: 7 }); // Stops before wall at row 7
    });

    test('stops at wall when moving up', () => {
      const robotsAboveWall: Robots = {
        ...robots,
        red: { x: 8, y: 6 }
      };
      const result = moveRobot(robotsAboveWall, wallsConfig, 'red', Direction.Up);
      expect(result).toEqual({ x: 8, y: 5 }); // Stops after crossing wall at row 4
    });

    test('stops at wall when moving right', () => {
      const result = moveRobot(robots, wallsConfig, 'yellow', Direction.Right);
      expect(result).toEqual({ x: 7, y: 8 }); // Stops before wall at column 7
    });

    test('stops at wall when moving left', () => {
      const robotsRightOfWall: Robots = {
        ...robots,
        yellow: { x: 6, y: 8 }
      };
      const result = moveRobot(robotsRightOfWall, wallsConfig, 'yellow', Direction.Left);
      expect(result).toEqual({ x: 5, y: 8 }); // Stops after crossing wall at column 4
    });

    test('slides past positions without walls', () => {
      const result = moveRobot(robots, wallsConfig, 'green', Direction.Up);
      expect(result).toEqual({ x: 10, y: 0 }); // No walls in the way
    });
  });

  describe('Movement with other robots', () => {
    const emptyWalls: Walls = {
      horizontal: Array(16).fill([]),
      vertical: Array(16).fill([])
    };

    test('stops before hitting another robot', () => {
      const robots: Robots = {
        red: { x: 5, y: 5 },
        yellow: { x: 5, y: 8 },  // Below red
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, emptyWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 5, y: 7 }); // Stops one space before yellow
    });

    test('stops before hitting robot when moving up', () => {
      const robots: Robots = {
        red: { x: 5, y: 10 },
        yellow: { x: 5, y: 3 },  // Above red
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, emptyWalls, 'red', Direction.Up);
      expect(result).toEqual({ x: 5, y: 4 }); // Stops one space before yellow
    });

    test('stops before hitting robot when moving right', () => {
      const robots: Robots = {
        red: { x: 3, y: 5 },
        yellow: { x: 10, y: 5 },  // Right of red
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, emptyWalls, 'red', Direction.Right);
      expect(result).toEqual({ x: 9, y: 5 }); // Stops one space before yellow
    });

    test('stops before hitting robot when moving left', () => {
      const robots: Robots = {
        red: { x: 10, y: 5 },
        yellow: { x: 3, y: 5 },  // Left of red
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, emptyWalls, 'red', Direction.Left);
      expect(result).toEqual({ x: 4, y: 5 }); // Stops one space before yellow
    });

    test('robot adjacent to another robot does not move', () => {
      const robots: Robots = {
        red: { x: 5, y: 5 },
        yellow: { x: 5, y: 6 },  // Directly below red
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, emptyWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 5, y: 5 }); // Cannot move at all
    });

    test('robot can move past positions of other robots in different lanes', () => {
      const robots: Robots = {
        red: { x: 5, y: 5 },
        yellow: { x: 6, y: 8 },  // Not in red's path
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, emptyWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 5, y: 15 }); // Yellow not in the way
    });
  });

  describe('Complex scenarios with walls and robots', () => {
    const complexWalls: Walls = {
      horizontal: [
        [],
        [],
        [5],        // Wall below row 2, column 5
        [],
        [],
        [10]        // Wall below row 5, column 10
      ],
      vertical: [
        [],
        [],
        [5],        // Wall right of column 2, row 5
        [],
        [],
        [10]        // Wall right of column 5, row 10
      ]
    };

    test('stops at wall even with robot further away', () => {
      const robots: Robots = {
        red: { x: 5, y: 0 },
        yellow: { x: 5, y: 10 },  // Far below
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, complexWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 5, y: 2 }); // Stops at wall, not at yellow
    });

    test('stops at robot even with wall further away', () => {
      const robots: Robots = {
        red: { x: 10, y: 0 },
        yellow: { x: 10, y: 3 },  // Above the wall
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, complexWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 10, y: 2 }); // Stops at yellow, not at wall
    });

    test('stops at nearest obstacle (robot before wall)', () => {
      const robots: Robots = {
        red: { x: 5, y: 0 },
        yellow: { x: 5, y: 1 },  // Between red and wall
        green: { x: 10, y: 10 },
        blue: { x: 0, y: 0 }
      };

      const result = moveRobot(robots, complexWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 5, y: 0 }); // Can't move, yellow is adjacent
    });

    test('slides correctly with multiple robots in path', () => {
      const robots: Robots = {
        red: { x: 5, y: 0 },
        yellow: { x: 5, y: 5 },
        green: { x: 5, y: 10 },
        blue: { x: 5, y: 15 }
      };

      const result = moveRobot(robots, complexWalls, 'red', Direction.Down);
      expect(result).toEqual({ x: 5, y: 2 }); // Stops at wall at row 2
    });
  });

  describe('Edge cases', () => {
    const emptyWalls: Walls = {
      horizontal: Array(16).fill([]),
      vertical: Array(16).fill([])
    };

    const robots: Robots = {
      red: { x: 0, y: 0 },
      yellow: { x: 15, y: 15 },
      green: { x: 0, y: 15 },
      blue: { x: 15, y: 0 }
    };

    test('robot at top-left corner moving up stays in place', () => {
      const result = moveRobot(robots, emptyWalls, 'red', Direction.Up);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    test('robot at top-left corner moving left stays in place', () => {
      const result = moveRobot(robots, emptyWalls, 'red', Direction.Left);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    test('robot at bottom-right corner moving down stays in place', () => {
      const result = moveRobot(robots, emptyWalls, 'yellow', Direction.Down);
      expect(result).toEqual({ x: 15, y: 15 });
    });

    test('robot at bottom-right corner moving right stays in place', () => {
      const result = moveRobot(robots, emptyWalls, 'yellow', Direction.Right);
      expect(result).toEqual({ x: 15, y: 15 });
    });
  });
});

describe('applyMove', () => {
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

  test('applies move and returns new robot positions', () => {
    const move: Move = { robot: 'red', direction: Direction.Up };
    const result = applyMove(initialRobots, emptyWalls, move);

    expect(result.red).toEqual({ x: 5, y: 0 });
    expect(result.yellow).toEqual({ x: 10, y: 10 }); // Unchanged
    expect(result.green).toEqual({ x: 2, y: 2 }); // Unchanged
    expect(result.blue).toEqual({ x: 13, y: 13 }); // Unchanged
  });

  test('does not modify original robot positions', () => {
    const move: Move = { robot: 'yellow', direction: Direction.Left };
    applyMove(initialRobots, emptyWalls, move);

    expect(initialRobots.yellow).toEqual({ x: 10, y: 10 }); // Original unchanged
  });

  test('applies move with robot collision', () => {
    const move: Move = { robot: 'red', direction: Direction.Right };
    const result = applyMove(initialRobots, emptyWalls, move);

    expect(result.red).toEqual({ x: 15, y: 5 }); // Slides to edge (yellow is at different y)
  });
});

describe('applyMoves', () => {
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

  test('applies sequence of moves correctly', () => {
    const moves: Move[] = [
      { robot: 'red', direction: Direction.Up },
      { robot: 'red', direction: Direction.Right },
      { robot: 'yellow', direction: Direction.Left }
    ];

    const result = applyMoves(initialRobots, emptyWalls, moves);

    expect(result.red).toEqual({ x: 15, y: 0 }); // Up then right
    expect(result.yellow).toEqual({ x: 0, y: 10 }); // Left to edge
  });

  test('applies empty move sequence (no change)', () => {
    const result = applyMoves(initialRobots, emptyWalls, []);
    expect(result).toEqual(initialRobots);
  });

  test('later moves see results of earlier moves', () => {
    const moves: Move[] = [
      { robot: 'red', direction: Direction.Right },    // Red to (15, 5)
      { robot: 'yellow', direction: Direction.Up },     // Yellow to (10, 0)
      { robot: 'yellow', direction: Direction.Right }   // Yellow to (15, 0)
    ];

    const result = applyMoves(initialRobots, emptyWalls, moves);

    expect(result.red).toEqual({ x: 15, y: 5 });
    expect(result.yellow).toEqual({ x: 15, y: 0 }); // Can move to (15,0), red is at (15,5)
  });

  test('robot can push through after another moves away', () => {
    const robots: Robots = {
      red: { x: 5, y: 5 },
      yellow: { x: 5, y: 7 },  // Blocking red's downward path
      green: { x: 2, y: 2 },
      blue: { x: 13, y: 13 }
    };

    const moves: Move[] = [
      { robot: 'yellow', direction: Direction.Right },  // Yellow moves away
      { robot: 'red', direction: Direction.Down }       // Red can now slide down
    ];

    const result = applyMoves(robots, emptyWalls, moves);

    expect(result.yellow).toEqual({ x: 15, y: 7 }); // Yellow moved right
    expect(result.red).toEqual({ x: 5, y: 15 });    // Red can slide all the way down
  });
});

describe('positionsEqual', () => {
  test('returns true for equal positions', () => {
    expect(positionsEqual({ x: 5, y: 10 }, { x: 5, y: 10 })).toBe(true);
    expect(positionsEqual({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(true);
    expect(positionsEqual({ x: 15, y: 15 }, { x: 15, y: 15 })).toBe(true);
  });

  test('returns false for different x coordinates', () => {
    expect(positionsEqual({ x: 5, y: 10 }, { x: 6, y: 10 })).toBe(false);
  });

  test('returns false for different y coordinates', () => {
    expect(positionsEqual({ x: 5, y: 10 }, { x: 5, y: 11 })).toBe(false);
  });

  test('returns false for different positions', () => {
    expect(positionsEqual({ x: 5, y: 10 }, { x: 10, y: 5 })).toBe(false);
  });
});

describe('getRobotPosition', () => {
  const robots: Robots = {
    red: { x: 5, y: 7 },
    yellow: { x: 10, y: 3 },
    green: { x: 2, y: 14 },
    blue: { x: 15, y: 0 }
  };

  test('returns position of specified robot', () => {
    expect(getRobotPosition(robots, 'red')).toEqual({ x: 5, y: 7 });
    expect(getRobotPosition(robots, 'yellow')).toEqual({ x: 10, y: 3 });
    expect(getRobotPosition(robots, 'green')).toEqual({ x: 2, y: 14 });
    expect(getRobotPosition(robots, 'blue')).toEqual({ x: 15, y: 0 });
  });

  test('returns a copy, not the original position', () => {
    const redPos = getRobotPosition(robots, 'red');
    redPos.x = 99;
    expect(robots.red.x).toBe(5); // Original unchanged
  });
});
