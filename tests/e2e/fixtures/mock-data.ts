/**
 * Mock data for E2E tests
 * Provides sample game states, rounds, and API responses
 */

import type { Robots, Walls, Goal } from '../../../shared/types';

/**
 * Sample robots starting positions
 */
export const sampleRobots: Robots = {
  red: { x: 3, y: 2 },
  yellow: { x: 12, y: 3 },
  green: { x: 4, y: 13 },
  blue: { x: 11, y: 12 }
};

/**
 * Sample walls structure (simplified for testing)
 */
export const sampleWalls: Walls = {
  horizontal: Array(16).fill(null).map(() => []),
  vertical: Array(16).fill(null).map(() => [])
};

// Add center square walls
sampleWalls.horizontal[6].push(7, 8);
sampleWalls.horizontal[8].push(7, 8);
sampleWalls.vertical[6].push(7, 8);
sampleWalls.vertical[8].push(7, 8);

/**
 * Sample goals (all 17)
 */
export const sampleGoals: Goal[] = [
  { position: { x: 5, y: 5 }, color: 'red' },
  { position: { x: 10, y: 5 }, color: 'yellow' },
  { position: { x: 5, y: 10 }, color: 'green' },
  { position: { x: 10, y: 10 }, color: 'blue' },
  { position: { x: 3, y: 7 }, color: 'multi' },
  { position: { x: 12, y: 7 }, color: 'multi' },
  { position: { x: 7, y: 3 }, color: 'multi' },
  { position: { x: 7, y: 12 }, color: 'multi' },
  { position: { x: 2, y: 2 }, color: 'red' },
  { position: { x: 13, y: 2 }, color: 'yellow' },
  { position: { x: 2, y: 13 }, color: 'green' },
  { position: { x: 13, y: 13 }, color: 'blue' },
  { position: { x: 7, y: 5 }, color: 'multi' },
  { position: { x: 7, y: 10 }, color: 'multi' },
  { position: { x: 5, y: 7 }, color: 'multi' },
  { position: { x: 10, y: 7 }, color: 'multi' },
  { position: { x: 7, y: 7 }, color: 'multi' }
];

/**
 * Mock getCurrentRound response - Active round
 */
export function mockActiveRoundResponse(gameId: string = 'game_test') {
  const now = Date.now();
  
  return {
    success: true,
    data: {
      gameId,
      gameName: 'Test Game',
      roundId: `${gameId}_round1`,
      roundNumber: 1,
      status: 'active',
      hasActiveRound: true,
      gameComplete: false,
      puzzle: {
        walls: sampleWalls,
        robots: sampleRobots,
        allGoals: sampleGoals,
        goalPosition: sampleGoals[0].position,
        goalColor: sampleGoals[0].color
      },
      startTime: now - 60000, // Started 1 minute ago
      endTime: now + 3540000, // Ends in ~59 minutes
      goalsCompleted: 0,
      goalsRemaining: 17
    }
  };
}

/**
 * Mock getCurrentRound response - Pending round (host preview)
 */
export function mockPendingRoundResponse(gameId: string = 'game_test') {
  return {
    success: true,
    data: {
      gameId,
      gameName: 'Test Game',
      roundId: `${gameId}_round1`,
      roundNumber: 1,
      status: 'pending',
      hasActiveRound: false,
      gameComplete: false,
      puzzle: {
        walls: sampleWalls,
        robots: sampleRobots,
        allGoals: sampleGoals,
        goalPosition: sampleGoals[0].position,
        goalColor: sampleGoals[0].color
      },
      goalsCompleted: 0,
      goalsRemaining: 17
    }
  };
}

/**
 * Mock getCurrentRound response - Completed round
 */
export function mockCompletedRoundResponse(gameId: string = 'game_test') {
  const now = Date.now();
  
  return {
    success: true,
    data: {
      gameId,
      gameName: 'Test Game',
      roundId: `${gameId}_round1`,
      roundNumber: 1,
      status: 'completed',
      hasActiveRound: false,
      gameComplete: false,
      puzzle: {
        walls: sampleWalls,
        robots: sampleRobots,
        allGoals: sampleGoals,
        goalPosition: sampleGoals[0].position,
        goalColor: sampleGoals[0].color
      },
      startTime: now - 3660000, // Started ~61 minutes ago
      endTime: now - 60000, // Ended 1 minute ago
      goalsCompleted: 1,
      goalsRemaining: 16
    }
  };
}

/**
 * Mock getCurrentRound response - No active round
 */
export function mockNoActiveRoundResponse(gameId: string = 'game_test') {
  return {
    success: true,
    data: {
      gameId,
      gameName: 'Test Game',
      hasActiveRound: false,
      gameComplete: false,
      goalsCompleted: 5,
      goalsRemaining: 12
    }
  };
}

/**
 * Mock getCurrentRound response - Game complete
 */
export function mockGameCompleteResponse(gameId: string = 'game_test') {
  return {
    success: true,
    data: {
      gameId,
      gameName: 'Test Game',
      hasActiveRound: false,
      gameComplete: true,
      goalsCompleted: 17,
      goalsRemaining: 0
    }
  };
}

/**
 * Mock getLeaderboard response - Empty leaderboard
 */
export function mockEmptyLeaderboardResponse() {
  return {
    success: true,
    data: {
      solutions: []
    }
  };
}

/**
 * Mock getLeaderboard response - With solutions
 */
export function mockLeaderboardWithSolutionsResponse() {
  const now = Date.now();
  
  return {
    success: true,
    data: {
      roundStatus: 'active',
      solutions: [
        {
          rank: 1,
          playerName: 'Alice',
          moveCount: 15,
          submittedAt: now - 120000, // 2 minutes ago
          moves: [
            { robot: 'red', direction: 'right' },
            { robot: 'red', direction: 'down' },
            { robot: 'blue', direction: 'left' }
          ],
          winningRobot: 'red'
        },
        {
          rank: 2,
          playerName: 'Bob',
          moveCount: 18,
          submittedAt: now - 60000, // 1 minute ago
          moves: [
            { robot: 'yellow', direction: 'down' },
            { robot: 'yellow', direction: 'left' }
          ],
          winningRobot: 'yellow'
        },
        {
          rank: 3,
          playerName: 'Charlie',
          moveCount: 20,
          submittedAt: now - 30000, // 30 seconds ago
          moves: [
            { robot: 'green', direction: 'up' },
            { robot: 'green', direction: 'right' }
          ],
          winningRobot: 'green'
        }
      ]
    }
  };
}

/**
 * Mock getLeaderboard response - Completed round (with replay data)
 */
export function mockCompletedLeaderboardResponse() {
  const now = Date.now();
  
  return {
    success: true,
    data: {
      roundStatus: 'completed',
      solutions: [
        {
          rank: 1,
          playerName: 'Alice',
          moveCount: 15,
          submittedAt: now - 3660000,
          moves: [
            { robot: 'red', direction: 'right' },
            { robot: 'red', direction: 'down' },
            { robot: 'red', direction: 'left' }
          ],
          winningRobot: 'red'
        },
        {
          rank: 2,
          playerName: 'Bob',
          moveCount: 18,
          submittedAt: now - 3600000,
          moves: [
            { robot: 'yellow', direction: 'down' },
            { robot: 'yellow', direction: 'left' },
            { robot: 'yellow', direction: 'up' }
          ],
          winningRobot: 'yellow'
        }
      ]
    }
  };
}

/**
 * Mock submitSolution response - Success
 */
export function mockSubmitSolutionSuccessResponse() {
  return {
    success: true,
    data: {
      rank: 1,
      moveCount: 15,
      solution: {
        rank: 1,
        moveCount: 15,
        submissionNumber: 1
      },
      leaderboard: {
        yourSubmissionCount: 1
      }
    }
  };
}

/**
 * Mock submitSolution response - Improved solution
 */
export function mockSubmitSolutionImprovedResponse() {
  return {
    success: true,
    data: {
      rank: 1,
      moveCount: 12,
      solution: {
        rank: 1,
        moveCount: 12,
        submissionNumber: 2
      },
      leaderboard: {
        yourSubmissionCount: 2
      }
    }
  };
}

/**
 * Mock error response - Game not found
 */
export function mockGameNotFoundResponse() {
  return {
    success: false,
    error: 'Game not found',
    code: 'GAME_NOT_FOUND'
  };
}
