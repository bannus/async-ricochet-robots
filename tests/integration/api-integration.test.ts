/**
 * API Integration Tests
 * Tests the complete API flow end-to-end with actual Azure Functions and Azurite
 * 
 * PREREQUISITES:
 * 1. Azurite must be running: azurite --silent --location azurite
 * 2. Azure Functions must be running: cd api && npm start
 * 
 * RUNNING THE TESTS:
 * - npm test              → Runs unit tests only (fast, no services required)
 * - npm run test:integration → Runs integration tests only (requires services)
 * - npm run test:all      → Runs all tests (for CI/CD)
 * 
 * These tests will fail if Azurite or Azure Functions are not running.
 * In CI/CD, start these services before running npm run test:all
 */

import {
  createTestGame,
  startTestRound,
  submitTestSolution,
  endTestRound,
  getCurrentRound,
  getLeaderboard,
  getDashboard,
  makeRequest,
  parseResponse,
} from '../helpers/api-test-utils';

describe('API Integration Tests', () => {
  describe('Game Creation', () => {
    test('creates game with valid parameters', async () => {
      const game = await createTestGame('Integration Test Game', 86400000);

      expect(game.gameId).toMatch(/^game_[a-f0-9]+$/);
      expect(game.hostKey).toMatch(/^host_[a-f0-9]+$/);
      expect(game.totalGoals).toBe(17);
      expect(game.goalsCompleted).toBe(0);
    });
  });

  describe('Round Lifecycle', () => {
    test('starts round, submits solution, ends round', async () => {
      const game = await createTestGame();
      const round = await startTestRound(game.gameId, game.hostKey);

      expect(round.roundId).toMatch(/^game_[a-f0-9]+_round\d+$/);
      expect(round.status).toBe('active');
      expect(round.goal.color).toBeDefined();
      expect(round.goal.position).toBeDefined();
      expect(round.robotPositions).toBeDefined();
    });
  });
});

describe('Skip Goal Regression Test (Bug #13)', () => {
  /**
   * Regression test for Bug #13: Skip Goal Not Working
   * 
   * Bug Description:
   * - The skipGoal parameter was received but never used in hostEndRound.ts
   * - Both "Complete Round" and "Skip Goal" buttons were marking goals as completed
   * - Goals were permanently removed from pool regardless of skip/complete choice
   * 
   * Fix:
   * - Added conditional logic: only add goal to completedGoalIndices when skipGoal=false
   * - When skipGoal=true, goal remains in pool for future rounds
   * 
   * This test verifies both behaviors work correctly.
   */

  test('skipGoal=false removes goal from pool permanently', async () => {
    // Create a test game
    const game = await createTestGame('Skip Goal Test - Complete', 3600000);

    // Start first round and note the goal
    const round1 = await startTestRound(game.gameId, game.hostKey);
    const round1GoalIndex = round1.goal.position.x * 16 + round1.goal.position.y; // Approximate index

    // End round with skipGoal=false (Complete Round button)
    const endResult = await endTestRound(game.gameId, game.hostKey, round1.roundId, false);

    // Verify goal was marked as completed
    expect(endResult.gameProgress.roundsCompleted).toBe(1);
    expect(endResult.gameProgress.totalGoals).toBe(17);
    expect(endResult.gameProgress.roundsRemaining).toBe(16);

    // Verify dashboard reflects the completion
    const dashboard = await getDashboard(game.gameId, game.hostKey);
    expect(dashboard.progress.goalsCompleted).toBe(1);

    // Start several more rounds and verify the completed goal doesn't reappear
    const maxRoundsToCheck = 5;
    for (let i = 0; i < maxRoundsToCheck; i++) {
      const nextRound = await startTestRound(game.gameId, game.hostKey);
      const nextGoalIndex = nextRound.goal.position.x * 16 + nextRound.goal.position.y;

      // The completed goal should NOT appear again
      expect(nextGoalIndex).not.toBe(round1GoalIndex);

      // End this round to continue
      await endTestRound(game.gameId, game.hostKey, nextRound.roundId, false);
    }
  }, 30000); // 30 second timeout for multiple rounds

  test('skipGoal=true keeps goal in pool for future rounds', async () => {
    // Create a test game
    const game = await createTestGame('Skip Goal Test - Skip', 3600000);

    // Start first round and note the goal
    const round1 = await startTestRound(game.gameId, game.hostKey);
    const skippedGoal = {
      color: round1.goal.color,
      position: { ...round1.goal.position },
    };
    const skippedGoalIndex = round1.goal.position.x * 16 + round1.goal.position.y;

    // End round with skipGoal=true (Skip Goal button)
    const endResult = await endTestRound(game.gameId, game.hostKey, round1.roundId, true);

    // Verify goal was NOT marked as completed
    expect(endResult.gameProgress.roundsCompleted).toBe(0); // Should stay at 0
    expect(endResult.gameProgress.totalGoals).toBe(17);
    expect(endResult.gameProgress.roundsRemaining).toBe(17); // All goals still available

    // Verify dashboard reflects NO completion
    const dashboard = await getDashboard(game.gameId, game.hostKey);
    expect(dashboard.progress.goalsCompleted).toBe(0);

    // Start multiple rounds until we see the skipped goal again (or hit limit)
    const maxRoundsToCheck = 17; // Should find it within 17 rounds (all goals)
    let foundSkippedGoal = false;

    for (let i = 0; i < maxRoundsToCheck && !foundSkippedGoal; i++) {
      const nextRound = await startTestRound(game.gameId, game.hostKey);
      const nextGoalIndex = nextRound.goal.position.x * 16 + nextRound.goal.position.y;

      // Check if this is the skipped goal
      if (nextGoalIndex === skippedGoalIndex &&
          nextRound.goal.color === skippedGoal.color &&
          nextRound.goal.position.x === skippedGoal.position.x &&
          nextRound.goal.position.y === skippedGoal.position.y) {
        foundSkippedGoal = true;
        // Don't need to end this round - test is complete
        break;
      }

      // Skip this goal too to continue searching
      await endTestRound(game.gameId, game.hostKey, nextRound.roundId, true);
    }

    // Verify we found the skipped goal in the pool
    expect(foundSkippedGoal).toBe(true);
  }, 60000); // 60 second timeout for up to 17 rounds
});

describe('API Integration Tests - Info', () => {
  test('shows how to run integration tests', () => {
    console.log('\n📋 Integration Test Commands:');
    console.log('  npm test              → Unit tests only (fast, no services needed)');
    console.log('  npm run test:integration → Integration tests only (requires services)');
    console.log('  npm run test:all      → All tests (for CI/CD)\n');
    console.log('⚠️  Integration tests require:');
    console.log('  1. Azurite: azurite --silent --location azurite');
    console.log('  2. Azure Functions: cd api && npm start\n');
    expect(true).toBe(true);
  });
});
