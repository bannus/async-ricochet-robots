# E2E Tests for Async Ricochet Robots

This directory contains end-to-end tests for the player app UI using Playwright with mocked API responses.

## Test Structure

- **player-app.spec.ts** - Main player app flows (12 tests)
  - Create game screen
  - Active round display
  - Leaderboard display
  - Game states (no round, complete, error)
  - Player controls
  - LocalStorage persistence

- **replay.spec.ts** - Solution replay functionality (6 tests)
  - Replay triggering
  - Exit replay (ESC key and button)
  - Path preview on hover
  - Controls disabled during replay

- **fixtures/** - Mock data and API helpers
  - `mock-data.ts` - Sample game states and API responses
  - `mock-api.ts` - Helper functions to mock API endpoints

## Running Tests

### Run all E2E tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/e2e/player-app.spec.ts
```

### Run tests in UI mode (interactive)
```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Generate HTML report
```bash
npx playwright show-report
```

## How It Works

1. **Mock API Responses**: Tests use Playwright's `page.route()` to intercept API calls and return mock data
2. **No Backend Required**: Tests run entirely in the browser with mocked responses
3. **Fast Execution**: Typical test run completes in ~10-15 seconds
4. **Implementation Agnostic**: Tests verify UI behavior, not internal code structure

## Test Philosophy

These tests are designed to:
- ✅ Survive refactoring (test behavior, not implementation)
- ✅ Run fast (mocked APIs, no network delays)
- ✅ Be maintainable (clear test names, focused assertions)
- ✅ Catch real bugs (test actual user workflows)

## Adding New Tests

1. Create mock data in `fixtures/mock-data.ts`
2. Add mock helper in `fixtures/mock-api.ts`
3. Write test using the mocks
4. Run test to verify it passes

Example:
```typescript
test('my new test', async ({ page }) => {
  // Setup mocks
  await setupActiveGameMocks(page);
  
  // Navigate
  await page.goto('/?game=game_test');
  await page.waitForLoadState('networkidle');
  
  // Assert
  await expect(page.locator('#my-element')).toBeVisible();
});
```

## Debugging Failed Tests

1. Run with `--headed` to see browser
2. Run with `--debug` for step-through debugging
3. Check screenshots in `test-results/` folder
4. Review HTML report with `npx playwright show-report`

## Coverage

Current test coverage:
- ✅ 12 main player app flow tests
- ✅ 6 replay mode tests
- ✅ 18 total tests

These tests provide confidence for refactoring the player-app.ts file.
