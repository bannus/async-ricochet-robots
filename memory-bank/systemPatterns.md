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
