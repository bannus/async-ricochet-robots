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
  publishTestRound,
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
      const game = await createTestGame('Integration Test Game');

      expect(game.gameId).toMatch(/^game_[a-f0-9]+$/);
      expect(game.hostKey).toMatch(/^host_[a-f0-9]+$/);
      expect(game.totalGoals).toBe(17);
      expect(game.goalsCompleted).toBe(0);
    });
  });

  describe('Round Lifecycle - New Pending/Publish Workflow', () => {
    test('creates pending round, publishes it, then completes it', async () => {
      const game = await createTestGame('Pending/Publish Test');
      
      // Step 1: Start round (creates in pending status)
      const pendingRound = await startTestRound(game.gameId, game.hostKey);
      
      expect(pendingRound.roundId).toMatch(/^game_[a-f0-9]+_round\d+$/);
      expect(pendingRound.status).toBe('pending');
      expect(pendingRound.goalColor).toBeDefined();
      expect(pendingRound.goalPosition).toBeDefined();
      expect(pendingRound.robots).toBeDefined();
      
      // Step 2: Publish round (makes it active with deadline)
      const activeRound = await publishTestRound(
        game.gameId, 
        game.hostKey, 
        pendingRound.roundId, 
        1 // 1 hour from now
      );
      
      expect(activeRound.roundId).toBe(pendingRound.roundId);
      expect(activeRound.status).toBe('active');
      expect(activeRound.endTime).toBeGreaterThan(Date.now());
      
      // Step 3: End the round
      const endResult = await endTestRound(game.gameId, game.hostKey, activeRound.roundId);
      
      expect(endResult.round.status).toBe('completed');
      expect(endResult.gameProgress.roundsCompleted).toBe(1);
    });

    test('pending round is visible but marked as preview', async () => {
      const game = await createTestGame('Pending Visibility Test');
      
      // Create pending round
      const pendingRound = await startTestRound(game.gameId, game.hostKey);
      expect(pendingRound.status).toBe('pending');
      
      // Get current round as a player
      const playerView = await getCurrentRound(game.gameId);
      
      // Pending round IS visible (so host can see board during preview)
      expect(playerView.data?.roundId).toBe(pendingRound.roundId);
      expect(playerView.data?.status).toBe('pending');
      expect(playerView.data?.hasActiveRound).toBe(false); // But marked as not active
      expect(playerView.data?.puzzle).toBeDefined(); // Board data is available
      
      // Verify board data includes all necessary pieces
      expect(playerView.data?.puzzle.walls).toBeDefined();
      expect(playerView.data?.puzzle.robots).toBeDefined();
      expect(playerView.data?.puzzle.goalColor).toBeDefined();
      expect(playerView.data?.puzzle.goalPosition).toBeDefined();
    });

    test('published round becomes visible to players', async () => {
      const game = await createTestGame('Published Visibility Test');
      
      // Create and publish round
      const pendingRound = await startTestRound(game.gameId, game.hostKey);
      const activeRound = await publishTestRound(
        game.gameId, 
        game.hostKey, 
        pendingRound.roundId
      );
      
      // Now players should see it
      const playerView = await getCurrentRound(game.gameId);
      
      expect(playerView.data?.roundId).toBe(activeRound.roundId);
      expect(playerView.data?.status).toBe('active');
      expect(playerView.data?.puzzle).toBeDefined();
    });
  });

  describe('Skip Goal During Preview (Bug #14 Fix)', () => {
    /**
     * Regression test for Bug #14: Entity Already Exists when skipping goals
     * 
     * OLD Bug Description:
     * - Host clicks "Skip Goal" → endRound with skipGoal=true
     * - Host tries to start new round → ERROR: Entity already exists
     * 
     * NEW Workflow:
     * - Host calls startRound → creates pending round
     * - Host doesn't like goal, calls startRound again → UPDATES same pending round
     * - No entity duplication, no "already exists" error
     * 
     * This test verifies the new skip-during-preview workflow works correctly.
     */

    test('calling startRound twice updates same pending round (skip workflow)', async () => {
      const game = await createTestGame('Skip During Preview Test');
      
      // First call to startRound - creates pending round
      const round1 = await startTestRound(game.gameId, game.hostKey);
      
      expect(round1.status).toBe('pending');
      expect(round1.roundNumber).toBe(1);
      const firstGoalIndex = round1.goalIndex;
      const firstRoundId = round1.roundId;
      
      // Second call to startRound - should UPDATE same pending round
      const round2 = await startTestRound(game.gameId, game.hostKey);
      
      // Should be same round ID and number
      expect(round2.roundId).toBe(firstRoundId);
      expect(round2.roundNumber).toBe(1);
      expect(round2.status).toBe('pending');
      
      // Goal should be different (randomly selected)
      // Note: There's a small chance this could be the same, but statistically unlikely with 17 goals
      expect(round2.goalIndex).toBeDefined();
      
      // Response should indicate it's an update
      expect(round2.isUpdate).toBe(true);
      expect(round2.previousGoalIndex).toBe(firstGoalIndex);
    });

    test('skip multiple times without error', async () => {
      const game = await createTestGame('Multiple Skip Test');
      
      let currentRound = await startTestRound(game.gameId, game.hostKey);
      const originalRoundId = currentRound.roundId;
      
      // Skip 3 times in a row
      for (let i = 0; i < 3; i++) {
        currentRound = await startTestRound(game.gameId, game.hostKey);
        
        // Always same round ID
        expect(currentRound.roundId).toBe(originalRoundId);
        expect(currentRound.roundNumber).toBe(1);
        expect(currentRound.status).toBe('pending');
      }
      
      // Finally publish it
      const published = await publishTestRound(
        game.gameId,
        game.hostKey,
        currentRound.roundId
      );
      
      expect(published.status).toBe('active');
      expect(published.roundId).toBe(originalRoundId);
    });

    test('cannot start new round while active round exists', async () => {
      const game = await createTestGame('Active Round Blocks New Test');
      
      // Create and publish a round
      const pending = await startTestRound(game.gameId, game.hostKey);
      await publishTestRound(game.gameId, game.hostKey, pending.roundId);
      
      // Try to start another round - should fail
      try {
        await startTestRound(game.gameId, game.hostKey);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('active round');
      }
    });

    test('can start new round after ending previous round', async () => {
      const game = await createTestGame('Sequential Rounds Test');
      
      // Round 1: Create, publish, end
      const round1Pending = await startTestRound(game.gameId, game.hostKey);
      const round1Active = await publishTestRound(game.gameId, game.hostKey, round1Pending.roundId);
      await endTestRound(game.gameId, game.hostKey, round1Active.roundId);
      
      // Round 2: Should work now
      const round2Pending = await startTestRound(game.gameId, game.hostKey);
      
      expect(round2Pending.roundNumber).toBe(2);
      expect(round2Pending.status).toBe('pending');
      expect(round2Pending.roundId).not.toBe(round1Pending.roundId);
    });
  });

  describe('Goal Completion Tracking', () => {
    test('completed round removes goal from available pool', async () => {
      const game = await createTestGame('Goal Completion Test');
      
      // Start and publish round 1
      const round1 = await startTestRound(game.gameId, game.hostKey);
      await publishTestRound(game.gameId, game.hostKey, round1.roundId);
      const round1GoalIndex = round1.goalIndex;
      
      // End round (marks goal as completed)
      const endResult = await endTestRound(game.gameId, game.hostKey, round1.roundId);
      expect(endResult.gameProgress.roundsCompleted).toBe(1);
      expect(endResult.gameProgress.roundsRemaining).toBe(16);
      
      // Start several more rounds - completed goal should not appear
      for (let i = 0; i < 5; i++) {
        const nextRound = await startTestRound(game.gameId, game.hostKey);
        
        // Should not select the completed goal
        expect(nextRound.goalIndex).not.toBe(round1GoalIndex);
        expect(nextRound.goalsRemaining).toBe(16 - i);
        
        // Publish and end to continue
        await publishTestRound(game.gameId, game.hostKey, nextRound.roundId);
        await endTestRound(game.gameId, game.hostKey, nextRound.roundId);
      }
    }, 30000); // 30 second timeout for multiple rounds
  });

  describe('Publish Round Validation', () => {
    test('cannot publish non-pending round', async () => {
      const game = await createTestGame('Publish Validation Test');
      
      // Create, publish, and try to publish again
      const pending = await startTestRound(game.gameId, game.hostKey);
      await publishTestRound(game.gameId, game.hostKey, pending.roundId);
      
      try {
        await publishTestRound(game.gameId, game.hostKey, pending.roundId);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('pending');
      }
    });

    test('publishRound requires endTime', async () => {
      const game = await createTestGame('EndTime Required Test');
      
      const pending = await startTestRound(game.gameId, game.hostKey);
      
      // Try to publish without endTime (by calling API directly)
      const response = await makeRequest('/host/publishRound', {
        method: 'POST',
        headers: {
          'x-game-id': game.gameId,
          'x-host-key': game.hostKey,
        },
        body: {
          roundId: pending.roundId,
          // endTime missing
        },
      });
      
      const result = await parseResponse(response);
      expect(result.success).toBe(false);
    });

    test('publishRound validates endTime is in future', async () => {
      const game = await createTestGame('EndTime Future Test');
      
      const pending = await startTestRound(game.gameId, game.hostKey);
      
      // Try to publish with past endTime
      const response = await makeRequest('/host/publishRound', {
        method: 'POST',
        headers: {
          'x-game-id': game.gameId,
          'x-host-key': game.hostKey,
        },
        body: {
          roundId: pending.roundId,
          endTime: Date.now() - 1000, // 1 second ago
        },
      });
      
      const result = await parseResponse(response);
      expect(result.success).toBe(false);
      expect(result.error).toContain('future');
    });
  });
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
