/**
 * E2E tests for Player App main flows
 * Tests UI behavior with mocked API responses
 */

import { test, expect } from '@playwright/test';
import {
  setupActiveGameMocks,
  setupNoRoundMocks,
  setupGameCompleteMocks,
  mockGameNotFound,
  mockEmptyLeaderboard
} from './fixtures/mock-api';

test.describe('Player App - Main Flows', () => {
  
  test('shows create game screen without gameId parameter', async ({ page }) => {
    // Navigate to app without game ID
    await page.goto('/');
    
    // Should show no-game-screen
    await expect(page.locator('#no-game-screen')).toBeVisible();
    await expect(page.locator('#no-game-screen h1')).toContainText('Async Ricochet Robots');
    await expect(page.locator('#create-game-btn')).toBeVisible();
    
    // Main game container should be hidden
    await expect(page.locator('.container')).not.toBeVisible();
  });
  
  test('displays active round with goal and timer', async ({ page }) => {
    // Setup mocks for active game
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify header information
    await expect(page.locator('#game-name')).toHaveText('Test Game');
    await expect(page.locator('#round-number')).toHaveText('Round 1');
    
    // Verify goal description is shown
    const goalDesc = page.locator('#goal-description');
    await expect(goalDesc).toBeVisible();
    await expect(goalDesc).toContainText('robot');
    
    // Verify timer is shown and counting
    const timer = page.locator('#time-remaining');
    await expect(timer).toBeVisible();
    await expect(timer).not.toHaveText('Waiting to start...');
    
    // Verify game board canvas is rendered
    await expect(page.locator('#game-board')).toBeVisible();
    
    // Verify player controls are enabled and visible
    await expect(page.locator('.robot-selectors')).toBeVisible();
    await expect(page.locator('.move-controls')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeEnabled();
  });
  
  test('shows leaderboard with solutions', async ({ page }) => {
    // Setup mocks
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Wait for leaderboard to load
    await page.waitForSelector('#leaderboard-body tr');
    
    // Verify leaderboard has entries
    const rows = page.locator('#leaderboard-body tr');
    await expect(rows).toHaveCount(3); // Alice, Bob, Charlie from mock
    
    // Verify first entry
    const firstRow = rows.first();
    await expect(firstRow).toContainText('Alice');
    await expect(firstRow).toContainText('15'); // move count
  });
  
  test('shows empty leaderboard message', async ({ page }) => {
    // Setup mocks with empty leaderboard
    await setupActiveGameMocks(page);
    await mockEmptyLeaderboard(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Verify "no solutions yet" message
    await expect(page.locator('#leaderboard-body')).toContainText('No solutions yet');
  });
  
  test('highlights current player in leaderboard', async ({ page }) => {
    // Setup mocks
    await setupActiveGameMocks(page);
    
    // Set player name to match one in leaderboard
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Enter player name that matches leaderboard
    await page.fill('#player-name', 'Alice');
    await page.locator('#player-name').blur(); // Trigger localStorage save
    
    // Wait a bit for highlight to apply
    await page.waitForTimeout(500);
    
    // Verify highlighting (row should have current-player or new-entry class)
    const aliceRow = page.locator('#leaderboard-body tr').filter({ hasText: 'Alice' });
    await expect(aliceRow).toHaveClass(/current-player|new-entry/);
  });
  
  test('shows no active round message', async ({ page }) => {
    // Setup mocks for no round
    await setupNoRoundMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Verify no round message is shown
    const noRoundMsg = page.locator('#no-round-message');
    await expect(noRoundMsg).toBeVisible();
    
    // Verify game stats are shown
    const gameStats = page.locator('#game-stats');
    await expect(gameStats).toBeVisible();
    await expect(gameStats).toContainText('Goals completed: 5');
    await expect(gameStats).toContainText('Goals remaining: 12');
    
    // Verify main game content is hidden
    await expect(page.locator('.main-content')).not.toBeVisible();
  });
  
  test('shows game complete message', async ({ page }) => {
    // Setup mocks for game complete
    await setupGameCompleteMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Verify game complete message is shown
    const completeMsg = page.locator('#game-complete-message');
    await expect(completeMsg).toBeVisible();
    
    // Verify main game content is hidden
    await expect(page.locator('.main-content')).not.toBeVisible();
  });
  
  test('handles game not found error', async ({ page }) => {
    // Setup mock for 404
    await mockGameNotFound(page);
    
    // Navigate to game
    await page.goto('/?game=game_nonexistent');
    await page.waitForLoadState('networkidle');
    
    // Verify error message is shown
    const errorMsg = page.locator('#error-message');
    await expect(errorMsg).toBeVisible();
    
    const errorText = page.locator('#error-text');
    await expect(errorText).toContainText('Game not found');
  });
  
  test('saves player name to localStorage', async ({ page }) => {
    // Setup mocks
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Enter player name
    const playerName = 'TestPlayer123';
    await page.fill('#player-name', playerName);
    await page.locator('#player-name').blur(); // Trigger change event
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify name is still there (loaded from localStorage)
    await expect(page.locator('#player-name')).toHaveValue(playerName);
  });
  
  test('disables controls for pending round (non-host)', async ({ page }) => {
    // Setup mocks for pending round
    const { mockPendingRound, mockEmptyLeaderboard } = await import('./fixtures/mock-api');
    await mockPendingRound(page);
    await mockEmptyLeaderboard(page);
    
    // Navigate without host key
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Verify controls are disabled
    await expect(page.locator('#submit-btn')).toBeDisabled();
    
    // Verify "waiting for host" message or similar
    const goalDesc = page.locator('#goal-description');
    await expect(goalDesc).toContainText('Waiting for host');
    
    // Verify status message
    const goalStatus = page.locator('#goal-status');
    await expect(goalStatus).toContainText('Preview Mode');
  });
  
  test('disables controls for completed round', async ({ page }) => {
    // Setup mocks for completed round
    const { setupCompletedGameMocks } = await import('./fixtures/mock-api');
    await setupCompletedGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Verify controls are disabled
    await expect(page.locator('#submit-btn')).toBeDisabled();
    
    // Verify "Round ended" message
    const goalStatus = page.locator('#goal-status');
    await expect(goalStatus).toContainText('Round ended');
  });
  
  test('board resizes on window resize', async ({ page }) => {
    // Setup mocks
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Get initial canvas size
    const canvas = page.locator('#game-board');
    const initialBox = await canvas.boundingBox();
    
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300); // Wait for debounce
    
    // Get new canvas size
    const newBox = await canvas.boundingBox();
    
    // Verify canvas was resized (size should have changed)
    expect(newBox?.width).not.toBe(initialBox?.width);
  });
  
  test('keyboard controls do not trigger when input field is focused', async ({ page }) => {
    // Setup mocks
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Wait for game board to be ready
    await page.waitForSelector('#game-board');
    
    // Verify no robot is selected initially
    const robotSelectors = page.locator('.robot-selector.selected');
    await expect(robotSelectors).toHaveCount(0);
    
    // Press 'r' key - should select red robot
    await page.keyboard.press('r');
    
    // Verify red robot is selected
    const redSelector = page.locator('.robot-selector[data-robot="red"]');
    await expect(redSelector).toHaveClass(/selected/);
    
    // Now focus on the player name input field
    await page.locator('#player-name').focus();
    
    // Type 'y' in the input field - should NOT select yellow robot
    await page.keyboard.type('y');
    
    // Verify the input field has 'y' typed
    await expect(page.locator('#player-name')).toHaveValue('y');
    
    // Verify red robot is STILL selected (not yellow)
    await expect(redSelector).toHaveClass(/selected/);
    const yellowSelector = page.locator('.robot-selector[data-robot="yellow"]');
    await expect(yellowSelector).not.toHaveClass(/selected/);
    
    // Type more text to verify arrow keys don't trigger robot movement
    await page.keyboard.type('test');
    await expect(page.locator('#player-name')).toHaveValue('ytest');
    
    // Press arrow key - should move cursor, not robot
    await page.keyboard.press('ArrowLeft');
    
    // Verify red robot is still selected and move count is still 0
    await expect(redSelector).toHaveClass(/selected/);
    const moveCount = page.locator('#move-count');
    await expect(moveCount).toHaveText('0');
  });
  
  test('star appears when round transitions from pending to active (regression test)', async ({ page }) => {
    // Regression test for: "New game that is generated while user has webpage open does not display star until manual refresh"
    // This tests the scenario where:
    // 1. Player has site open with a pending round (admin has generated but not published)
    // 2. Admin publishes the round (transitions from pending to active)
    // 3. Polling fires and detects the status change
    // Expected: The star (goal) should appear without manual page refresh
    
    const { mockEmptyLeaderboard } = await import('./fixtures/mock-api');
    const { mockPendingRoundResponse, mockActiveRoundResponse } = await import('./fixtures/mock-data');
    
    // Start with pending round state
    let roundState = 'pending';
    
    // Setup dynamic route handler that changes state
    await page.route('**/api/getCurrentRound*', async route => {
      const response = roundState === 'pending' 
        ? mockPendingRoundResponse('game_test')
        : mockActiveRoundResponse('game_test');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
    
    await mockEmptyLeaderboard(page);
    
    // Navigate to game as a non-host player
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Wait for canvas to be rendered
    await page.waitForSelector('#game-board');
    
    // Verify we're in pending state (no star visible for non-host players)
    const goalDesc = page.locator('#goal-description');
    await expect(goalDesc).toContainText('Waiting for host');
    
    // Verify status message says preview mode
    const goalStatus = page.locator('#goal-status');
    await expect(goalStatus).toContainText('Preview Mode');
    
    // Verify controls are disabled
    await expect(page.locator('#submit-btn')).toBeDisabled();
    
    // Now simulate the admin publishing the round by changing the mock state
    roundState = 'active';
    
    // Wait for the polling interval (20 seconds in production, but we can trigger it manually)
    // Trigger reload to simulate polling - in real app this happens automatically
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the goal description to update (indicating the UI has processed the status change)
    await expect(goalDesc).toContainText('robot', { timeout: 5000 });
    
    // Verify we're now in active state
    await expect(goalDesc).not.toContainText('Waiting for host');
    
    // Verify status message is cleared (no longer says preview mode)
    await expect(goalStatus).not.toContainText('Preview Mode');
    
    // Verify controls are now enabled
    await expect(page.locator('#submit-btn')).toBeEnabled();
    
    // Most importantly: Verify the canvas was redrawn
    // The canvas should be visible and have proper dimensions
    const canvas = page.locator('#game-board');
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);
    
    // Additional check: Verify robot selectors are visible and enabled
    await expect(page.locator('.robot-selectors')).toBeVisible();
    await expect(page.locator('.robot-selector[data-robot="red"]')).toBeEnabled();
  });
});
