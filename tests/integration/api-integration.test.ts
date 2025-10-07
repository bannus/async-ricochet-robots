/**
 * API Integration Tests
 * Tests the complete API flow end-to-end with actual Azure Functions and Azurite
 * 
 * PREREQUISITES:
 * 1. Azurite must be running: azurite --silent --location azurite
 * 2. Azure Functions must be running: cd api && npm start
 * 
 * These tests are skipped by default. To run them:
 * - Remove .skip from the describe() statements below
 * - Ensure Azurite and Azure Functions are running
 */

import {
  createTestGame,
  startTestRound,
  submitTestSolution,
  endTestRound,
  getCurrentRound,
  getLeaderboard,
  makeRequest,
  parseResponse,
} from '../helpers/api-test-utils';

describe.skip('API Integration Tests', () => {
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

describe('API Integration Tests - Info', () => {
  test('shows how to run integration tests', () => {
    console.log('\n⚠️  API Integration tests are skipped by default.');
    console.log('To run them:');
    console.log('1. Start Azurite: azurite --silent --location azurite');
    console.log('2. Start Azure Functions: cd api && npm start');
    console.log('3. Remove .skip from describe() blocks in this file\n');
    expect(true).toBe(true);
  });
});
