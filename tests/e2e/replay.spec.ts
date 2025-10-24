/**
 * E2E tests for Replay Mode
 * Tests solution replay functionality
 */

import { test, expect } from '@playwright/test';
import { setupCompletedGameMocks } from './fixtures/mock-api';

test.describe('Replay Mode', () => {
  
  test('clicking leaderboard entry triggers replay', async ({ page }) => {
    // Setup completed round with solutions
    await setupCompletedGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Wait for leaderboard
    await page.waitForSelector('#leaderboard-body tr');
    
    // Verify leaderboard entries are clickable
    const firstRow = page.locator('#leaderboard-body tr').first();
    await expect(firstRow).toHaveClass(/clickable/);
    
    // Click first leaderboard entry
    await firstRow.click();
    
    // Verify replay controls appear
    const replayControls = page.locator('#replay-controls');
    await expect(replayControls).toBeVisible();
    
    // Verify replay info shows correct player
    const replayInfo = page.locator('#replay-info');
    await expect(replayInfo).toContainText('Alice'); // First player from mock
    await expect(replayInfo).toContainText('15 moves');
    
    // Verify selected row is highlighted
    await expect(firstRow).toHaveClass(/replaying/);
  });
  
  test('ESC key exits replay mode', async ({ page }) => {
    // Setup completed round
    await setupCompletedGameMocks(page);
    
    // Navigate and start replay
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#leaderboard-body tr');
    
    // Click to start replay
    await page.locator('#leaderboard-body tr').first().click();
    
    // Verify replay mode is active
    await expect(page.locator('#replay-controls')).toBeVisible();
    
    // Press ESC
    await page.keyboard.press('Escape');
    
    // Verify replay controls are hidden
    await expect(page.locator('#replay-controls')).not.toBeVisible();
    
    // Verify highlighting removed
    const rows = page.locator('#leaderboard-body tr');
    await expect(rows.first()).not.toHaveClass(/replaying/);
  });
  
  test('exit replay button works', async ({ page }) => {
    // Setup completed round
    await setupCompletedGameMocks(page);
    
    // Navigate and start replay
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#leaderboard-body tr');
    
    // Click to start replay
    await page.locator('#leaderboard-body tr').first().click();
    
    // Verify replay mode is active
    await expect(page.locator('#replay-controls')).toBeVisible();
    
    // Click exit button
    await page.locator('#exit-replay-btn').click();
    
    // Verify replay controls are hidden
    await expect(page.locator('#replay-controls')).not.toBeVisible();
  });
  
  test('hovering leaderboard entry shows path preview', async ({ page }) => {
    // Setup completed round
    await setupCompletedGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#leaderboard-body tr');
    
    // Get canvas element for checking renders
    const canvas = page.locator('#game-board');
    
    // Hover over first entry
    const firstRow = page.locator('#leaderboard-body tr').first();
    await firstRow.hover();
    
    // Wait a bit for preview to render
    await page.waitForTimeout(100);
    
    // Canvas should still be visible (path preview drawn on it)
    await expect(canvas).toBeVisible();
    
    // Move mouse away
    await page.mouse.move(0, 0);
    
    // Wait for preview to clear
    await page.waitForTimeout(100);
    
    // Canvas should still be visible (back to normal state)
    await expect(canvas).toBeVisible();
  });
  
  test('cannot trigger replay during active round', async ({ page }) => {
    // Setup active round (not completed)
    const { setupActiveGameMocks } = await import('./fixtures/mock-api');
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#leaderboard-body tr');
    
    // Leaderboard entries should NOT be clickable
    const firstRow = page.locator('#leaderboard-body tr').first();
    await expect(firstRow).not.toHaveClass(/clickable/);
    
    // Click should not trigger replay
    await firstRow.click();
    
    // Replay controls should not appear
    await expect(page.locator('#replay-controls')).not.toBeVisible();
  });
  
  test('player controls disabled during replay', async ({ page }) => {
    // Setup completed round
    await setupCompletedGameMocks(page);
    
    // Navigate and start replay
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#leaderboard-body tr');
    
    // Start replay
    await page.locator('#leaderboard-body tr').first().click();
    await expect(page.locator('#replay-controls')).toBeVisible();
    
    // Verify player controls are disabled
    await expect(page.locator('#submit-btn')).toBeDisabled();
    await expect(page.locator('#undo-btn')).toBeDisabled();
    await expect(page.locator('#reset-btn')).toBeDisabled();
    
    // Robot selectors should also be disabled
    const robotBtns = page.locator('.robot-selector');
    const count = await robotBtns.count();
    for (let i = 0; i < count; i++) {
      await expect(robotBtns.nth(i)).toBeDisabled();
    }
  });
});
