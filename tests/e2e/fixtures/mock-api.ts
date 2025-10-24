/**
 * API Mocking utilities for E2E tests
 * Provides helper functions to mock API endpoints using Playwright's route functionality
 */

import { Page } from '@playwright/test';
import {
  mockActiveRoundResponse,
  mockPendingRoundResponse,
  mockCompletedRoundResponse,
  mockNoActiveRoundResponse,
  mockGameCompleteResponse,
  mockEmptyLeaderboardResponse,
  mockLeaderboardWithSolutionsResponse,
  mockCompletedLeaderboardResponse,
  mockSubmitSolutionSuccessResponse,
  mockGameNotFoundResponse
} from './mock-data';

/**
 * Mock the getCurrentRound API endpoint with an active round
 */
export async function mockActiveRound(page: Page, gameId: string = 'game_test') {
  await page.route('**/api/getCurrentRound*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockActiveRoundResponse(gameId))
    });
  });
}

/**
 * Mock the getCurrentRound API endpoint with a pending round (host preview)
 */
export async function mockPendingRound(page: Page, gameId: string = 'game_test') {
  await page.route('**/api/getCurrentRound*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPendingRoundResponse(gameId))
    });
  });
}

/**
 * Mock the getCurrentRound API endpoint with a completed round
 */
export async function mockCompletedRound(page: Page, gameId: string = 'game_test') {
  await page.route('**/api/getCurrentRound*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCompletedRoundResponse(gameId))
    });
  });
}

/**
 * Mock the getCurrentRound API endpoint with no active round
 */
export async function mockNoActiveRound(page: Page, gameId: string = 'game_test') {
  await page.route('**/api/getCurrentRound*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockNoActiveRoundResponse(gameId))
    });
  });
}

/**
 * Mock the getCurrentRound API endpoint with game complete state
 */
export async function mockGameComplete(page: Page, gameId: string = 'game_test') {
  await page.route('**/api/getCurrentRound*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGameCompleteResponse(gameId))
    });
  });
}

/**
 * Mock the getCurrentRound API endpoint with game not found error
 */
export async function mockGameNotFound(page: Page) {
  await page.route('**/api/getCurrentRound*', async route => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify(mockGameNotFoundResponse())
    });
  });
}

/**
 * Mock the getLeaderboard API endpoint with empty leaderboard
 */
export async function mockEmptyLeaderboard(page: Page) {
  await page.route('**/api/getLeaderboard*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEmptyLeaderboardResponse())
    });
  });
}

/**
 * Mock the getLeaderboard API endpoint with solutions
 */
export async function mockLeaderboardWithSolutions(page: Page) {
  await page.route('**/api/getLeaderboard*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLeaderboardWithSolutionsResponse())
    });
  });
}

/**
 * Mock the getLeaderboard API endpoint with completed round solutions (for replay testing)
 */
export async function mockCompletedLeaderboard(page: Page) {
  await page.route('**/api/getLeaderboard*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCompletedLeaderboardResponse())
    });
  });
}

/**
 * Mock the submitSolution API endpoint with success response
 */
export async function mockSubmitSolutionSuccess(page: Page) {
  await page.route('**/api/submitSolution*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSubmitSolutionSuccessResponse())
    });
  });
}

/**
 * Setup complete mock environment for active game with leaderboard
 */
export async function setupActiveGameMocks(page: Page, gameId: string = 'game_test') {
  await mockActiveRound(page, gameId);
  await mockLeaderboardWithSolutions(page);
  await mockSubmitSolutionSuccess(page);
}

/**
 * Setup complete mock environment for completed round with replay capability
 */
export async function setupCompletedGameMocks(page: Page, gameId: string = 'game_test') {
  await mockCompletedRound(page, gameId);
  await mockCompletedLeaderboard(page);
}

/**
 * Setup complete mock environment for no active round state
 */
export async function setupNoRoundMocks(page: Page, gameId: string = 'game_test') {
  await mockNoActiveRound(page, gameId);
}

/**
 * Setup complete mock environment for game complete state
 */
export async function setupGameCompleteMocks(page: Page, gameId: string = 'game_test') {
  await mockGameComplete(page, gameId);
}

/**
 * Setup complete mock environment for pending round (host preview)
 */
export async function setupPendingRoundMocks(page: Page, gameId: string = 'game_test') {
  await mockPendingRound(page, gameId);
  await mockEmptyLeaderboard(page);
}
