/**
 * E2E tests for goal reached behavior
 * Tests that board becomes non-interactive after goal is reached
 */

import { test, expect } from '@playwright/test';
import { setupActiveGameMocks } from './fixtures/mock-api';

test.describe('Goal Reached Behavior', () => {
  
  test('board becomes non-interactive after goal is reached', async ({ page }) => {
    // Setup mocks for active game
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Select red robot
    await page.click('[data-robot="red"]');
    
    // Make a few moves to simulate reaching the goal
    // We'll use keyboard to move the robot
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    // Simulate goal reached by injecting JavaScript
    // This is a workaround since we can't easily make the robot reach the goal in tests
    await page.evaluate(() => {
      const controller = (window as any).app?.controller;
      if (controller) {
        // Trigger goal reached state by calling the private method through evaluation
        controller.isGoalReached = true;
        controller.showGoalReached('red', 5);
        controller.updateUI();
      }
    });
    
    // Wait a bit for UI to update
    await page.waitForTimeout(200);
    
    // Verify goal status shows "Goal reached"
    const goalStatus = page.locator('#goal-status');
    await expect(goalStatus).toContainText('Goal reached');
    
    // Try to move the robot again - it should not move
    const moveCountBefore = await page.locator('#move-count').textContent();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    const moveCountAfter = await page.locator('#move-count').textContent();
    
    // Move count should not have changed
    expect(moveCountAfter).toBe(moveCountBefore);
    
    // Try to click on another robot and move it
    await page.click('[data-robot="blue"]');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    
    // Move count should still not have changed
    const moveCountFinal = await page.locator('#move-count').textContent();
    expect(moveCountFinal).toBe(moveCountBefore);
  });
  
  test('undo clears goal-reached state and allows moves', async ({ page }) => {
    // Setup mocks for active game
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Select red robot and make moves
    await page.click('[data-robot="red"]');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    // Simulate goal reached
    await page.evaluate(() => {
      const controller = (window as any).app?.controller;
      if (controller) {
        controller.isGoalReached = true;
        controller.showGoalReached('red', 1);
        controller.updateUI();
      }
    });
    
    await page.waitForTimeout(200);
    
    // Verify goal status
    await expect(page.locator('#goal-status')).toContainText('Goal reached');
    
    // Click undo button
    await page.click('#undo-btn');
    await page.waitForTimeout(200);
    
    // Goal status should be cleared
    const goalStatus = await page.locator('#goal-status').textContent();
    expect(goalStatus?.trim()).toBe('');
    
    // Should be able to move again
    const moveCountBefore = await page.locator('#move-count').textContent();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const moveCountAfter = await page.locator('#move-count').textContent();
    
    // Move count should have changed (increased by 1)
    expect(parseInt(moveCountAfter || '0')).toBeGreaterThan(parseInt(moveCountBefore || '0'));
  });
  
  test('reset clears goal-reached state and allows moves', async ({ page }) => {
    // Setup mocks for active game
    await setupActiveGameMocks(page);
    
    // Navigate to game
    await page.goto('/?game=game_test');
    await page.waitForLoadState('networkidle');
    
    // Select red robot and make moves
    await page.click('[data-robot="red"]');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    // Simulate goal reached
    await page.evaluate(() => {
      const controller = (window as any).app?.controller;
      if (controller) {
        controller.isGoalReached = true;
        controller.showGoalReached('red', 1);
        controller.updateUI();
      }
    });
    
    await page.waitForTimeout(200);
    
    // Verify goal status
    await expect(page.locator('#goal-status')).toContainText('Goal reached');
    
    // Click reset button
    await page.click('#reset-btn');
    await page.waitForTimeout(200);
    
    // Goal status should be cleared
    const goalStatus = await page.locator('#goal-status').textContent();
    expect(goalStatus?.trim()).toBe('');
    
    // Move count should be 0
    const moveCount = await page.locator('#move-count').textContent();
    expect(moveCount).toBe('0');
    
    // Should be able to move again
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const moveCountAfter = await page.locator('#move-count').textContent();
    
    // Move count should now be 1
    expect(moveCountAfter).toBe('1');
  });
});
