# Test Directory Structure

This directory contains all automated tests for the Async Ricochet Robots project.

## Directory Organization

```
tests/
├── unit/                          # Unit tests for game engine
│   ├── game-engine.test.ts       # Robot movement and collision detection
│   ├── goal-placement.test.ts    # Goal generation and placement
│   ├── l-shape-utils.test.ts     # L-shape wall utilities
│   ├── solution-validator.test.ts # Solution validation logic
│   ├── types.test.ts             # Type definitions and validators
│   └── wall-utils.test.ts        # Wall collision detection
│
├── integration/                   # Integration tests
│   ├── game-integration.test.ts  # Full game engine integration
│   └── api-integration.test.ts   # API endpoint integration (skipped by default)
│
├── helpers/                       # Shared test utilities
│   └── api-test-utils.ts         # HTTP client helpers for API tests
│
├── manual-api-tests.http         # REST Client manual tests (22 scenarios)
├── TESTING_GUIDE.md              # Manual testing guide
├── MANUAL_TESTING_NEXT_STEPS.md  # Next steps for manual testing
└── README.md                     # This file
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Run only unit tests
npm test unit/

# Run only integration tests
npm test integration/

# Run a specific test file
npm test game-engine.test
```

### Watch Mode
```bash
npm test -- --watch
```

## Test Categories

### Unit Tests (207 tests)
Pure unit tests for the game engine components. These tests:
- Run quickly (< 5 seconds)
- Don't require external services
- Test logic in isolation
- Have high code coverage (>95%)

**Coverage:**
- `game-engine.test.ts` - 37 tests
- `goal-placement.test.ts` - 26 tests
- `l-shape-utils.test.ts` - 37 tests
- `solution-validator.test.ts` - 31 tests
- `types.test.ts` - 29 tests
- `wall-utils.test.ts` - 33 tests
- `game-integration.test.ts` - 14 tests

### API Integration Tests (Skipped by default)
End-to-end tests for Azure Functions API. These tests:
- Require Azurite and Azure Functions to be running
- Test actual HTTP endpoints
- Validate full game lifecycle
- Are skipped by default (use `.skip`)

**To run API integration tests:**
1. Start Azurite: `azurite --silent --location azurite`
2. Start Azure Functions: `cd api && npm start`
3. Remove `.skip` from describe blocks in `api-integration.test.ts`
4. Run: `npm test api-integration`

## Manual Testing

For manual API testing with REST Client:
1. Open `manual-api-tests.http` in VS Code
2. Ensure REST Client extension is installed
3. Follow instructions in `TESTING_GUIDE.md`
4. Click "Send Request" above each test section

## Test Utilities

### API Test Helpers (`helpers/api-test-utils.ts`)

Provides helper functions for API integration tests:

```typescript
// Create a test game
const game = await createTestGame('Test Game', 86400000);

// Start a round
const round = await startTestRound(gameId, hostKey);

// Submit a solution
await submitTestSolution(gameId, roundId, 'Alice', solutionData);

// End a round
await endTestRound(gameId, hostKey, roundId, skipGoal);

// Get current round
const current = await getCurrentRound(gameId);

// Get leaderboard
const leaderboard = await getLeaderboard(gameId, roundId);
```

## Test Coverage

Current test coverage:
- **Statements:** 96.46%
- **Branches:** 90%
- **Functions:** 100%
- **Lines:** 98.27%

To view detailed coverage:
```bash
npm test -- --coverage
```

## Adding New Tests

### Adding Unit Tests
1. Create test file in `tests/unit/` directory
2. Import modules from `../../shared/`
3. Follow existing test patterns
4. Run tests to verify

### Adding Integration Tests
1. Add tests to `tests/integration/game-integration.test.ts` for game engine
2. Add tests to `tests/integration/api-integration.test.ts` for API
3. Use helpers from `tests/helpers/api-test-utils.ts`
4. Remember to skip API tests by default

## CI/CD Integration (Planned)

When CI/CD is configured:
- Unit tests will run on every commit
- Integration tests will run on pull requests
- API tests will run with Azurite in CI environment
- Coverage reports will be generated automatically

## Troubleshooting

### Tests Failing After File Reorganization
If imports are broken after moving test files:
```bash
# Paths from unit/ and integration/ should use:
import { ... } from '../../shared/types';
```

### API Integration Tests Failing
Common issues:
- Azurite not running → Start with `azurite --silent --location azurite`
- Azure Functions not running → Start with `cd api && npm start`
- Port conflicts → Check ports 7071 (Functions) and 10000-10002 (Azurite)
- Connection refused → Wait for services to fully start

### Test Timeout
For slow tests (e.g., multi-color goal search):
```typescript
test('my slow test', async () => {
  // test code
}, 30000); // 30 second timeout
```

## Best Practices

1. **Keep tests focused** - One test, one assertion concept
2. **Use descriptive names** - Test names should explain what they verify
3. **Arrange-Act-Assert** - Structure tests clearly
4. **Don't test implementation** - Test behavior, not internals
5. **Mock external dependencies** - Unit tests should be isolated
6. **Clean up after tests** - Use afterEach for cleanup
7. **Skip flaky tests temporarily** - Use `.skip` instead of deleting

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [TypeScript Testing](https://github.com/microsoft/TypeScript/wiki/Performance)
- [REST Client Extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
