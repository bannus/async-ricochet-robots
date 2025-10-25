# System Patterns: Async Ricochet Robots

## Architecture Overview

### Serverless Stack
- **Frontend**: Azure Static Web Apps (vanilla TypeScript)
- **Backend**: Azure Functions v4 (TypeScript, HTTP triggers + timer)
- **Database**: Azure Table Storage (3 tables: Games, Rounds, Solutions)
- **Local Dev**: Azurite for storage emulation

### Communication Pattern
- **HTTP Polling** - Client polls every 20 seconds
- **No WebSockets** - Simpler, more reliable for async gameplay
- **CORS Enabled** - Development: `*`, Production: specific origins

## Key Technical Decisions

### 1. Multi-Game Isolation
**Pattern**: Partition by gameId
- Each game = separate Table Storage partition
- Host controls rounds (no automatic creation)
- Players join via gameId + round detection
- **Benefit**: Complete game isolation, no cross-game queries

### 2. Polling Architecture
**Pattern**: 20-second client-side intervals
```typescript
setInterval(async () => {
  const round = await api.getCurrentRound(gameId);
  if (round.roundId !== currentRoundId) {
    // New round detected, update UI
  }
}, 20000);
```
- **Rationale**: Async gameplay doesn't need real-time updates
- **Benefit**: Simple, reliable, no WebSocket complexity

### 3. Shared Game Engine
**Pattern**: Code duplication strategy
- `/shared/` - Source of truth (game engine, types, utilities)
- `/api/lib-shared/` - Copy for Azure Functions (build isolation)
- `/client/lib-shared/` - Copy for frontend (bundler isolation)
- **Rationale**: Prevents complex build configuration issues
- **Maintenance**: Update shared/ first, then copy to lib-shared/ dirs

### 4. Solution Validation
**Pattern**: Full game simulation server-side
```typescript
// Client submits moves only
POST /api/submitSolution
Body: { moves: [{ robotId, direction }, ...] }

// Server validates by replaying
const result = validateSolution(board, moves, goalIndex);
if (!result.valid) return 400;
```
- **Benefit**: Prevents cheating, ensures fair play
- **Trade-off**: Server CPU usage vs client trust

### 5. Host Authentication
**Pattern**: Inline key validation + storage verification
```typescript
// No JWT, no separate auth service
const hostKey = request.headers.get('X-Host-Key');
const game = await storage.getGame(gameId);
if (game.hostKey !== hostKey) return 401;
```
- **Rationale**: Simple, adequate for trusted friend groups
- **Security Level**: Medium (not production-grade, but sufficient)

## Data Model Patterns

### Table Storage Schema
```
Games Table (Partition: gameId)
├── Game entity (RowKey: 'info')
└── Host metadata

Rounds Table (Partition: gameId)
├── Round entities (RowKey: roundId)
└── Board state (JSON in string)

Solutions Table (Partition: roundId)
├── Solution entities (RowKey: playerId)
└── Move sequences (JSON in string)
```

### Round ID Format
**Standardized**: `{gameId}_round{number}`
- Example: `game_abc123_round1`
- **Important**: Single underscore before "round"
- Validated with regex: `/^[a-z0-9_]+_round\d+$/`

### Goal Representation
**Multi-color support**:
```typescript
interface Goal {
  position: Position;
  allowedRobots: RobotId[]; // ['red', 'yellow', 'green', 'blue'] or subset
}
```
- Single-color: `['red']`
- Multi-color: `['red', 'yellow', 'green', 'blue']` (any robot wins)

## Frontend Patterns

### Manager Pattern Architecture (October 2025 Refactoring)
**Pattern**: Extract cohesive responsibilities into focused manager classes

**Problem Solved**: `PlayerApp` had grown to 961 lines with multiple responsibilities mixed together, making it hard to maintain and test.

**Solution**: Extracted 4 manager classes following single responsibility principle:

```typescript
// PlayerApp (~418 lines) - Orchestration only
class PlayerApp {
  private uiState: UIStateManager;
  private timer: TimerManager;
  private leaderboard: LeaderboardManager;
  private replayMode: ReplayModeManager;
  
  constructor() {
    // Initialize managers
    this.uiState = new UIStateManager();
    this.timer = new TimerManager();
    this.leaderboard = new LeaderboardManager();
    this.replayMode = new ReplayModeManager(renderer, uiState, leaderboard);
    
    // Wire up callbacks
    this.leaderboard.setClickHandler((idx, solutions) => 
      this.replayMode.handleLeaderboardClick(idx, solutions)
    );
  }
}
```

**Manager Classes**:

1. **UIStateManager** (~200 lines) - UI visibility and state transitions
   - `showActiveRound()`, `showNoActiveRound()`, `showGameComplete()`, `showError()`
   - `updateHeader()`, `updateGoalDescription()`, `updateGoalStatus()`
   - `setPlayerControlsVisible()`, `setPlayerControlsEnabled()`
   - `showReplayControls()`, `hideReplayControls()`
   - Responsibilities: Show/hide UI sections, update text content, manage control states

2. **TimerManager** (~65 lines) - Countdown timer management
   - `start(endTime)`, `stop()`
   - Private: `updateDisplay(endTime)`
   - Responsibilities: Countdown display, interval cleanup, format time remaining

3. **LeaderboardManager** (~170 lines) - Leaderboard display and interaction
   - `display(data)` - Renders leaderboard with highlighting
   - `setClickHandler()`, `setHoverHandler()`, `setLeaveHandler()` - Callback setup
   - `highlightEntry()`, `clearReplayHighlight()` - Visual state management
   - Responsibilities: Render solutions, detect new entries, setup interaction handlers

4. **ReplayModeManager** (~145 lines) - Replay mode coordination
   - `handleLeaderboardClick()`, `handleLeaderboardHover()`, `clearPathPreview()`
   - `exit()`, `isActive()`, `setCurrentRound()`
   - Responsibilities: Coordinate replay state, integrate ReplayController/UI/Leaderboard

**Benefits**:
- **Maintainability**: Each class has single, clear purpose
- **Testability**: Managers can be unit tested independently
- **Readability**: PlayerApp becomes clear orchestrator (~56% code reduction)
- **Reusability**: Managers could be reused in other contexts
- **Separation**: UI logic separated from business logic and API calls

**Callback Pattern**:
```typescript
// Managers don't know about each other directly
// PlayerApp wires them together via callbacks
this.leaderboard.setClickHandler((index, solutions) => {
  this.replayMode.handleLeaderboardClick(index, solutions);
});
```

**Testing**: All 18 Playwright E2E tests pass after refactoring, confirming no functionality broken.

### Module Visibility Strategy (October 2025 Decision)
**Decision**: Use implicit public exports + class-level access modifiers (current approach)

**Rationale**: 
- Project size (~15 TypeScript files in `client/src/`) doesn't justify complex module systems
- Current patterns already provide adequate encapsulation
- Clear naming conventions signal intent (e.g., `UIStateManager` vs `PlayerApp`)
- Dependency injection + callback pattern creates natural boundaries

**Current Approach (Adequate for Project):**
```typescript
// All exported classes are "public" to the module system
export class UIStateManager {
  // Public API methods
  showActiveRound(): void { }
  updateHeader(name: string, round: number): void { }
  
  // Private implementation details
  private hideAllStates(): void { }
}

// PlayerApp coordinates via dependency injection
class PlayerApp {
  private uiState: UIStateManager;  // Owns the manager
  
  constructor() {
    this.uiState = new UIStateManager();
  }
}
```

**What We're NOT Using (and why):**
1. **Barrel Exports** (`index.ts` re-export pattern)
   - Adds extra file with no enforcement
   - People can still import directly
   - Useful for libraries, not needed for applications
   
2. **`@internal` JSDoc + `stripInternal` compiler option**
   - Requires additional TypeScript configuration
   - Not runtime enforced, only documentation
   - Better for published libraries than internal apps
   
3. **Separate "internal" directory structure**
   - Adds organizational complexity
   - Not needed with clear naming conventions

**Optional Improvement (Low Priority):**
Add JSDoc comments to document intended usage for manager classes:
```typescript
/**
 * UIStateManager
 * 
 * Manages UI visibility and state transitions for the player interface.
 * 
 * @internal - Intended for use by PlayerApp only.
 * Do not instantiate directly in other components.
 */
export class UIStateManager {
  // ...
}
```

**When to Reconsider:**
- Project grows to 30+ files in `client/src/`
- Need to publish client code as a library/package
- Multiple teams working on different parts
- Need strict API boundaries for breaking change management

**Benefits of Current Approach:**
- **Simplicity**: No extra build configuration or file structure
- **Clarity**: Naming + dependency injection shows intent
- **Maintainability**: Easy to understand, no hidden complexity
- **TypeScript Native**: Uses built-in access modifiers effectively
- **Testing**: All functionality testable without visibility workarounds

### User Notifications
**Pattern**: Toast notifications (non-blocking, typed)
```typescript
// Shared notification utility (client/src/notifications.ts)
import { showSuccess, showError, showWarning, showInfo } from './notifications.js';

// Usage examples
showSuccess('Round published successfully!');
showError('Failed to submit solution');
showWarning('Please enter your name');
showInfo('New round started!', 5000); // Custom duration
```
- **Implementation**: DOM-based toast elements, CSS animations
- **Types**: Success (green), Error (red), Warning (yellow), Info (blue)
- **Duration**: Default 3s, configurable per message
- **Position**: Top-center with slide-in animation
- **Benefits**: Non-blocking, color-coded, consistent UX
- **Migration**: 36 `alert()` dialogs replaced across codebase
- **Preserved**: `confirm()` dialogs for destructive actions (publish/complete rounds)

### Game History Tracking
**Pattern**: localStorage-based recent games list
```typescript
// Game history utility (client/src/game-history.ts)
import { GameHistoryManager } from './game-history.js';

// Track game visit
GameHistoryManager.addGame(gameId, gameName, isHost);

// Display on splash page
GameHistoryManager.renderGameList();

// Remove specific game
GameHistoryManager.removeGame(gameId);
```
- **Implementation**: 
  - Standalone `GameHistoryManager` class in dedicated file
  - Stores data in localStorage (key: `gameHistory`)
  - Tracks: gameId, gameName, lastVisited timestamp, host status
  - Limit: 10 most recent games
- **Features**:
  - Automatic tracking when visiting games
  - Click to navigate back to game
  - Individual delete buttons per entry
  - Host badge (🔑) for games user is hosting
  - Relative timestamps ("2 hours ago", "3 days ago")
- **UI Integration**:
  - Appears on splash page (no-game screen)
  - Hidden when no history exists
  - Card-like entries with hover effects
  - Touch-friendly (44px delete buttons on mobile)
- **Benefits**: 
  - Easy access to active games
  - No backend changes required
  - Per-device storage (privacy-friendly)
  - Better UX for returning players

### Canvas Rendering
**Pattern**: Immediate mode rendering
```typescript
render() {
  ctx.clearRect(0, 0, width, height);
  drawGrid();
  drawWalls();
  drawRobots();
  drawGoals();
}
```
- **Performance**: 60fps on 16×16 grid
- **No optimization needed**: Small grid, simple shapes

### State Management
**Pattern**: Polling-based with local state
```typescript
class PlayerApp {
  private currentRoundId: string | null = null;
  private pollingInterval: number;

  async poll() {
    const round = await api.getCurrentRound(gameId);
    if (round.roundId !== this.currentRoundId) {
      this.currentRoundId = round.roundId;
      this.updateUI(round);
    }
  }
}
```
- **No state management library** - Vanilla TypeScript sufficient
- **LocalStorage**: Player name persistence only

### API Client Pattern
**Pattern**: Typed wrapper with retry logic
```typescript
class ApiClient {
  async getCurrentRound(gameId: string): Promise<RoundResponse> {
    const response = await fetch(`${this.baseUrl}/getCurrentRound?gameId=${gameId}`);
    if (!response.ok) throw new ApiError(response.status);
    return response.json();
  }
}
```
- **Type safety**: Full TypeScript interfaces
- **Error handling**: Retry with exponential backoff
- **CORS**: Handled by Azure Static Web Apps configuration

## Backend Patterns

### Azure Functions Structure
**Pattern**: One function per endpoint
```
api/src/functions/
├── createGame.ts
├── getCurrentRound.ts
├── getLeaderboard.ts
├── submitSolution.ts
├── hostStartRound.ts
├── hostEndRound.ts
├── hostExtendRound.ts
├── hostDashboard.ts
└── checkRoundEnd.ts (timer)
```
- **Benefit**: Clear separation, easy to test
- **Trade-off**: More files vs monolithic handler

### Validation Layer
**Pattern**: Centralized input validation
```typescript
// shared/validation.ts
export function validateGameId(gameId: string): boolean {
  return /^game_[a-z0-9]+$/.test(gameId);
}

// In function
if (!validateGameId(gameId)) {
  return { status: 400, body: 'Invalid gameId format' };
}
```
- **Applied**: All user inputs validated
- **Security**: Prevents injection attacks

### Timer Function Pattern
**Pattern**: Scheduled background job (every 5 minutes)
```typescript
export async function checkRoundEnd(timer: Timer, context: InvocationContext) {
  const expiredRounds = await storage.getExpiredRounds();
  for (const round of expiredRounds) {
    await endRound(round.gameId, round.roundId);
  }
}
```
- **Cron**: `0 */5 * * * *` (every 5 minutes)
- **Cross-partition query**: Acceptable infrequent operation

## Testing Patterns

### Unit Testing Strategy
- **Framework**: Jest with TypeScript
- **Coverage Target**: >90% (currently 96.46%)
- **Approach**: TDD for game engine
- **File pattern**: `*.test.ts` in `/tests/unit/`

### Integration Testing
- **API tests**: Azurite + Azure Functions locally
- **Game tests**: Full gameplay scenarios
- **File pattern**: `*.test.ts` in `/tests/integration/`

### Manual Testing
- **HTTP files**: VS Code REST Client
- **Location**: `/tests/manual/manual-api-tests.http`
- **Coverage**: 22 comprehensive scenarios

## Deployment Patterns

### CI/CD Pipeline
**Pattern**: GitHub Actions → Azure Static Web Apps
```yaml
on: push to main
→ Build client (webpack)
→ Build API (tsc)
→ Deploy to Azure SWA
→ Functions auto-deployed (Managed Functions)
```

### Environment Configuration
**Development**:
- Azurite for storage
- Azure Functions Core Tools locally
- SWA CLI for full-stack debugging

**Production**:
- Azure Table Storage
- Azure Functions (Managed by SWA)
- Azure Static Web Apps

## Performance Patterns

### Optimization Strategy
1. **Client Bundle**: Target <50KB (currently achieved)
2. **API Response**: Target <500ms (achieved)
3. **Canvas Rendering**: 60fps target (achieved)
4. **Polling Interval**: 20s (adequate for async gameplay)

### Caching Strategy
- **None implemented** - Not needed for current scale
- **Future**: Consider CDN for static assets if needed

## Security Patterns

### Current Implementation
- Input validation on all endpoints
- Host key authentication (inline)
- CORS configuration
- No SQL injection risk (Table Storage, typed queries)

### Known Limitations
- Host key in headers (not encrypted in transit without HTTPS)
- No rate limiting (Azure handles at platform level)
- No user authentication (anonymous play by design)

## Error Handling Patterns

### API Error Responses
**Pattern**: Consistent error format
```typescript
{
  error: "Round not found",
  details: "No active round for game game_abc123"
}
```
- HTTP status codes used correctly
- Detailed error messages for debugging
- No sensitive information leaked

### Client Error Handling
**Pattern**: Graceful degradation
```typescript
try {
  const round = await api.getCurrentRound(gameId);
} catch (error) {
  if (error.status === 404) {
    showMessage("No active round");
  } else {
    showMessage("Network error, retrying...");
  }
}
```

## Key Learnings

### What Works Well
1. **Serverless simplifies deployment** - No infrastructure management
2. **Polling is adequate** - 20s interval feels responsive for async game
3. **Shared code strategy** - Duplication avoids build complexity
4. **TypeScript everywhere** - Catches errors early, improves maintainability

### What to Avoid
1. **Complex build configurations** - Keep it simple, duplicate code if needed
2. **Premature optimization** - Vanilla JS performs fine, no framework needed
3. **Over-engineering auth** - Simple key validation sufficient for friend groups
4. **WebSockets for async game** - Polling is simpler and more reliable

### Critical Patterns to Follow
1. **Validate all inputs** - Don't trust client data
2. **Use TypeScript strict mode** - Catches subtle bugs
3. **Test before deploying** - Azurite catches storage issues locally
4. **Document as you go** - Memory bank pattern maintains context

## Random Number Generation Pattern

### Custom Seeded PRNG Implementation
**Pattern**: Custom Linear Congruential Generator (LCG) for deterministic testing

**Implementation**: `shared/random-utils.ts`
```typescript
let seed = Date.now();

export function setSeed(newSeed: number): void {
  seed = newSeed;
}

export function random(): number {
  // LCG algorithm (Numerical Recipes parameters)
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
```

**Design Decisions**:
1. **Custom vs Library**: Chose custom implementation over libraries like `seedrandom`
   - **Zero dependencies** - Simpler deployment, no security audits
   - **Full control** - Complete understanding of behavior
   - **Sufficient quality** - Good enough for game board generation (not cryptography)
   - **Simple code** - Only 25 lines, easy to maintain

2. **Algorithm Choice**: Linear Congruential Generator (LCG)
   - **Parameters from Numerical Recipes** - Well-tested values
   - **Fast execution** - Simple multiplication and addition
   - **Adequate period** - Full 32-bit period (4.3 billion values)
   - **Not suitable for**: Cryptography, statistical simulations
   - **Perfect for**: Game board generation, UI randomness

**Usage Pattern**:
```typescript
// Production: Random boards every game
const puzzle = generatePuzzle(); // Uses Date.now() as seed

// Testing: Deterministic boards for reliable tests
beforeAll(() => {
  setSeed(12345); // Fixed seed
});
const puzzle = generatePuzzle(); // Same board every time
```

**Replaced `Math.random()` in**:
- `shared/l-shape-utils.ts` (5 call sites)
  - `getRandomOrientation()` - L-shape wall orientation
  - `addOuterEdgeWalls()` - Edge wall placement
  - `generateWalls()` - Deprecated function
- `shared/goal-placement.ts` (3 call sites)
  - `randomPositionInQuadrant()` - Goal position selection
  - `generateMultiColorGoal()` - Multi-color goal quadrant selection
- `shared/game-engine.ts` (2 call sites)
  - `generateRobotPositions()` - Robot starting positions

**Testing Strategy**:
1. **Unit Tests**: Use random seeds (default `Date.now()`)
   - Tests verify behavior across many random scenarios
   - Example: "generates varied positions" expects randomness
   - Benefits: Validates algorithm works with different inputs

2. **Integration Tests**: Use fixed seed (`setSeed(12345)`)
   - Tests verify specific game scenarios deterministically
   - Example: "robots interact as blockers" needs predictable board
   - Benefits: Prevents flaky tests, reproducible failures

**Benefits**:
- **Deterministic Testing**: Same seed = same board = reliable CI/CD
- **Zero Dependencies**: No external packages to maintain
- **Debugging Friendly**: Can reproduce exact board configurations
- **Production Unchanged**: Still random (Date.now() seed)
- **Simple Implementation**: Easy to understand and modify

**Trade-offs Accepted**:
- **Lower Quality**: LCG has known statistical weaknesses vs better PRNGs
- **Not Cryptographically Secure**: Never use for security purposes
- **Predictable Sequence**: Not suitable for gambling/lottery applications
- **Good Enough for Games**: Perfectly adequate for board game generation

**When to Reconsider**:
- Need cryptographically secure random numbers
- Statistical analysis reveals board generation bias
- Need to match specific library's random distribution
- Security audit requires using audited PRNG library
