# Phase 2 Implementation Plan: Backend API

## Overview

**Phase:** Backend API (Azure Functions)  
**Goal:** Build serverless API endpoints and database layer  
**Estimated Time:** 6-8 hours  
**Confidence Level:** 8/10  
**Prerequisites:** Phase 1 complete (game engine working)

This phase implements the Azure Functions backend with Azure Table Storage, creating all API endpoints defined in the specification.

---

## Task Breakdown

### Task 1: Azure Functions Project Setup
**Estimated Time:** 45 minutes  
**Priority:** High (Blocking)

#### What to Build
- Initialize Azure Functions project structure
- Configure local development environment
- Set up Azurite (local storage emulator)
- Install dependencies
- Configure environment variables

#### Folder Structure
```
async-ricochet-robots/
├── api/                      # Azure Functions
│   ├── getCurrentRound/      # Player endpoint
│   ├── getLeaderboard/       # Player endpoint
│   ├── submitSolution/       # Player endpoint
│   ├── createGame/           # Game management
│   ├── host/                 # Host endpoints
│   │   ├── startRound/
│   │   ├── extendRound/
│   │   ├── endRound/
│   │   └── dashboard/
│   ├── checkRoundEnd/        # Timer function
│   ├── shared/               # Shared utilities
│   │   ├── storage.js
│   │   ├── auth.js
│   │   └── validators.js
│   ├── host.json
│   ├── local.settings.json
│   └── package.json
├── shared/                   # ✅ From Phase 1
├── tests/                    # ✅ From Phase 1
└── doc/                      # ✅ Complete
```

#### Files to Create

1. **`api/host.json`**:
   ```json
   {
     "version": "2.0",
     "extensionBundle": {
       "id": "Microsoft.Azure.Functions.ExtensionBundle",
       "version": "[3.*, 4.0.0)"
     },
     "logging": {
       "applicationInsights": {
         "samplingSettings": {
           "isEnabled": true
         }
       }
     }
   }
   ```

2. **`api/local.settings.json`**:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true"
     }
   }
   ```

3. **`api/package.json`**:
   - Dependencies: `@azure/data-tables`, `@azure/functions`
   - Reference shared game engine: `"shared": "file:../shared"`

#### Commands to Run
```bash
cd api
npm init -y
npm install @azure/data-tables @azure/functions
npm install --save-dev @azure/functions-core-tools azurite
```

#### Success Criteria
- ✅ Azure Functions project initialized
- ✅ Azurite runs locally (`azurite-blob --silent --location azurite`)
- ✅ Can start functions locally (`npm start` or `func start`)
- ✅ Dependencies installed
- ✅ Environment configured

---

### Task 2: Storage Layer Abstraction
**Estimated Time:** 1.5 hours  
**Priority:** High (Blocking)  
**Dependencies:** Task 1

#### What to Build
**File:** `api/shared/storage.js`

Create abstraction layer for Azure Table Storage operations.

#### Classes to Implement

```javascript
const { TableClient } = require('@azure/data-tables');

/**
 * Base storage client wrapper
 */
class StorageClient {
  constructor(tableName) {
    this.tableClient = TableClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING,
      tableName
    );
  }

  async createEntity(entity) { }
  async getEntity(partitionKey, rowKey) { }
  async updateEntity(entity, mode = 'Merge') { }
  async deleteEntity(partitionKey, rowKey) { }
  async queryEntities(filter) { }
}

/**
 * Games table operations
 */
class GamesStorage extends StorageClient {
  constructor() {
    super('Games');
  }

  async createGame(gameData) { }
  async getGame(gameId) { }
  async updateGame(gameId, updates) { }
  async getCurrentRound(gameId) { }
}

/**
 * Rounds table operations
 */
class RoundsStorage extends StorageClient {
  constructor() {
    super('Rounds');
  }

  async createRound(gameId, roundData) { }
  async getRound(gameId, roundId) { }
  async updateRound(gameId, roundId, updates) { }
  async getActiveRound(gameId) { }
  async getAllActiveRounds() { }
  async getRoundHistory(gameId, limit = 10) { }
}

/**
 * Solutions table operations
 */
class SolutionsStorage extends StorageClient {
  constructor() {
    super('Solutions');
  }

  async submitSolution(gameId, roundId, solutionData) { }
  async getSolution(gameId, roundId, playerName) { }
  async getLeaderboard(gameId, roundId) { }
  async getSolutionCount(gameId, roundId) { }
}
```

#### Key Implementation Details

1. **Partition/Row Key Format:**
   - Games: PartitionKey="GAME", RowKey=gameId
   - Rounds: PartitionKey=gameId, RowKey=roundId
   - Solutions: PartitionKey=`${gameId}_${roundId}`, RowKey=playerName

2. **JSON Serialization:**
   - Complex objects stored as JSON strings
   - Parse on retrieval, stringify on storage
   - Properties: `boardData`, `solutionData`, `goalPosition`, `robotPositions`

3. **Error Handling:**
   - Handle `ResourceNotFound` errors
   - Return null for missing entities
   - Throw custom errors for duplicates

#### Test File
**File:** `tests/storage.test.js`

Test cases (using Azurite):
1. Create/read/update/delete entities
2. Query with filters
3. Handle missing entities
4. JSON serialization/deserialization
5. Partition key queries
6. Error scenarios

#### Success Criteria
- ✅ All CRUD operations work
- ✅ Proper partition/row key usage
- ✅ JSON handling correct
- ✅ Error handling robust
- ✅ Tests pass with Azurite
- ✅ Matches data-models.md schema

---

### Task 3: Authentication Middleware
**Estimated Time:** 30 minutes  
**Priority:** Medium  
**Dependencies:** Task 2

#### What to Build
**File:** `api/shared/auth.js`

Implement host key validation middleware.

#### Function to Implement

```javascript
/**
 * Validate host authentication headers
 * @param {Object} request - HTTP request
 * @returns {Object} {valid: boolean, gameId?: string, error?: string}
 */
async function validateHostAuth(request) {
  // 1. Extract headers: X-Game-Id, X-Host-Key
  // 2. Validate presence
  // 3. Query Games table
  // 4. Compare hostKey
  // 5. Return validation result
}

/**
 * HTTP middleware wrapper
 */
function requireHostAuth(handler) {
  return async (request, context) => {
    const auth = await validateHostAuth(request);
    if (!auth.valid) {
      return {
        status: 401,
        body: { success: false, error: auth.error, code: 'INVALID_HOST_KEY' }
      };
    }
    return handler(request, context, auth.gameId);
  };
}
```

#### Test File
**File:** `tests/auth.test.js`

Test cases:
1. Valid host key → authenticated
2. Invalid host key → 401
3. Missing headers → 401
4. Game not found → 401
5. Malformed headers → 401

#### Success Criteria
- ✅ Host authentication works
- ✅ Proper error responses
- ✅ Middleware pattern correct
- ✅ All tests pass

---

### Task 4: Input Validation Utilities
**Estimated Time:** 30 minutes  
**Priority:** Medium  
**Dependencies:** None

#### What to Build
**File:** `api/shared/validators.js`

Common validation functions for API inputs.

#### Functions to Implement

```javascript
function validatePlayerName(name) {
  // 1-20 characters, alphanumeric + spaces
}

function validateGameName(name) {
  // Optional, max 100 characters
}

function validateDuration(durationMs) {
  // Positive integer, reasonable range (1 hour - 7 days)
}

function validateSolutionData(solutionData) {
  // Array of moves, each with valid robot/direction
}

function sanitizePlayerName(name) {
  // Trim, lowercase for rowKey
}

function createErrorResponse(error, code) {
  // Standard error response format
}

function createSuccessResponse(data) {
  // Standard success response format
}
```

#### Success Criteria
- ✅ Validation functions work
- ✅ Sanitization correct
- ✅ Response formatters consistent
- ✅ Matches API specification format

---

### Task 5: Player Endpoint - getCurrentRound
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Tasks 2, 4

#### What to Build
**File:** `api/getCurrentRound/index.js`

HTTP GET endpoint returning current active round.

#### Implementation

```javascript
const { app } = require('@azure/functions');
const { GamesStorage, RoundsStorage } = require('../shared/storage');
const { createSuccessResponse, createErrorResponse } = require('../shared/validators');

app.http('getCurrentRound', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // 1. Extract gameId from query params
    // 2. Get game from storage
    // 3. Get active round (if exists)
    // 4. Parse boardData
    // 5. Return response based on state
  }
});
```

#### Response Scenarios

1. **Active Round:** Full puzzle + round data
2. **No Active Round:** Waiting message + game stats
3. **Game Complete:** All 17 goals done
4. **Game Not Found:** 404 error

#### Test File
**File:** `tests/api/getCurrentRound.test.js`

Test cases:
1. Active round returns correct data
2. No active round returns waiting message
3. Game complete returns completion message
4. Invalid gameId returns 404
5. Missing gameId returns 400

#### Success Criteria
- ✅ Returns correct data for all scenarios
- ✅ Matches API specification exactly
- ✅ Proper error handling
- ✅ Integration tests pass

---

### Task 6: Player Endpoint - getLeaderboard
**Estimated Time:** 45 minutes  
**Priority:** High  
**Dependencies:** Tasks 2, 4

#### What to Build
**File:** `api/getLeaderboard/index.js`

HTTP GET endpoint returning ranked solutions.

#### Implementation

```javascript
app.http('getLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // 1. Extract gameId, roundId from query
    // 2. Get round from storage
    // 3. Get all solutions for round
    // 4. Sort by moveCount, then submittedAt
    // 5. Assign ranks (ties share rank)
    // 6. Include solutionData only if round ended
  }
});
```

#### Ranking Logic

```javascript
function assignRanks(solutions) {
  solutions.sort((a, b) => {
    if (a.moveCount !== b.moveCount) return a.moveCount - b.moveCount;
    return a.submittedAt - b.submittedAt;
  });
  
  let rank = 1;
  for (let i = 0; i < solutions.length; i++) {
    if (i > 0 && solutions[i].moveCount > solutions[i-1].moveCount) {
      rank = i + 1;
    }
    solutions[i].rank = rank;
  }
}
```

#### Success Criteria
- ✅ Correct ranking with ties
- ✅ Solution data hidden during active round
- ✅ Solution data visible after round ends
- ✅ Matches API specification
- ✅ Tests pass

---

### Task 7: Player Endpoint - submitSolution
**Estimated Time:** 1.5 hours  
**Priority:** High  
**Dependencies:** Tasks 2, 4, Phase 1 (game engine)

#### What to Build
**File:** `api/submitSolution/index.js`

HTTP POST endpoint for solution submission with validation.

#### Implementation

```javascript
const { validateSolution } = require('../../shared/game-engine');

app.http('submitSolution', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // 1. Parse request body
    // 2. Validate inputs (gameId, roundId, playerName, solutionData)
    // 3. Get game and round
    // 4. Check round is active
    // 5. Validate solution with game engine
    // 6. Check for duplicate submission
    // 7. Store solution
    // 8. Calculate rank
    // 9. Return success with rank
  }
});
```

#### Validation Steps

1. **Input validation:** Required fields present
2. **Round status:** Must be active
3. **Game engine:** Solution reaches goal correctly
4. **Duplicate check:** Player hasn't submitted yet
5. **Move count:** Matches array length

#### Error Responses

- 400: Invalid solution format
- 400: Solution doesn't reach goal
- 400: Round has ended
- 404: Game or round not found
- 409: Duplicate submission

#### Success Criteria
- ✅ Valid solutions stored correctly
- ✅ Invalid solutions rejected with clear errors
- ✅ Duplicate prevention works
- ✅ Rank calculated correctly
- ✅ Multi-color goal support
- ✅ Integration tests pass

---

### Task 8: Game Management - createGame
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Tasks 2, 4, Phase 1 (puzzle generator)

#### What to Build
**File:** `api/createGame/index.js`

HTTP POST endpoint for game creation with puzzle generation.

#### Implementation

```javascript
const { generatePuzzle } = require('../../shared/puzzle-generator');
const crypto = require('crypto');

app.http('createGame', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // 1. Parse request body (gameName, defaultRoundDurationMs)
    // 2. Generate unique gameId
    // 3. Generate secure hostKey
    // 4. Generate puzzle (walls, robots, allGoals)
    // 5. Create boardData JSON
    // 6. Store in Games table
    // 7. Return gameId, hostKey, URLs
  }
});
```

#### ID Generation

```javascript
function generateGameId() {
  return 'game_' + crypto.randomBytes(8).toString('hex');
}

function generateHostKey() {
  return 'host_' + crypto.randomBytes(12).toString('hex');
}
```

#### Response Format

```javascript
{
  success: true,
  data: {
    gameId: "game_abc123xyz",
    hostKey: "host_9f8e7d6c5b4a",
    gameName: "Friday Night Puzzle",
    defaultRoundDurationMs: 86400000,
    createdAt: 1704000000000,
    totalGoals: 17,
    goalsCompleted: 0,
    gameUrl: "https://ricochet-robots.azurewebsites.net/?game=game_abc123xyz",
    hostUrl: "https://ricochet-robots.azurewebsites.net/host.html?game=game_abc123xyz&key=host_9f8e7d6c5b4a",
    message: "Game created successfully! Save your host key..."
  }
}
```

#### Success Criteria
- ✅ Game created with valid puzzle
- ✅ Unique IDs generated
- ✅ Secure host key
- ✅ All 17 goals present
- ✅ URLs formatted correctly
- ✅ Tests pass

---

### Task 9: Host Endpoint - startRound
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Tasks 2, 3, 4

#### What to Build
**File:** `api/host/startRound/index.js`

HTTP POST endpoint for starting new rounds (host authenticated).

#### Implementation

```javascript
const { requireHostAuth } = require('../../shared/auth');

app.http('hostStartRound', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: requireHostAuth(async (request, context, gameId) => {
    // 1. Parse duration (optional)
    // 2. Get game
    // 3. Check no active round exists
    // 4. Check completedGoalIndices.length < 17
    // 5. Select random goal from available
    // 6. Create round entity
    // 7. Update game.currentRoundId
    // 8. Return round data
  })
});
```

#### Goal Selection Logic

```javascript
function selectRandomGoal(allGoals, completedGoalIndices) {
  const availableIndices = [];
  for (let i = 0; i < allGoals.length; i++) {
    if (!completedGoalIndices.includes(i)) {
      availableIndices.push(i);
    }
  }
  
  if (availableIndices.length === 0) {
    throw new Error('ALL_GOALS_EXHAUSTED');
  }
  
  const randomIndex = Math.floor(Math.random() * availableIndices.length);
  return availableIndices[randomIndex];
}
```

#### Error Responses

- 400: Round already active
- 400: All goals exhausted (17 completed)
- 401: Invalid host key

#### Success Criteria
- ✅ Round created successfully
- ✅ Random goal selection works
- ✅ Game completion check
- ✅ Robot positions from boardData
- ✅ Host authentication required
- ✅ Tests pass

---

### Task 10: Host Endpoints - Remaining Operations
**Estimated Time:** 1.5 hours  
**Priority:** Medium  
**Dependencies:** Tasks 2, 3, 4, 9

#### What to Build

**Files:**
- `api/host/extendRound/index.js`
- `api/host/endRound/index.js`
- `api/host/dashboard/index.js`

#### 1. extendRound

```javascript
app.http('hostExtendRound', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  handler: requireHostAuth(async (request, context, gameId) => {
    // 1. Parse roundId, newEndTime OR extendByMs
    // 2. Get round
    // 3. Check round is active
    // 4. Calculate new endTime
    // 5. Update round
    // 6. Return confirmation
  })
});
```

#### 2. endRound

```javascript
app.http('hostEndRound', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: requireHostAuth(async (request, context, gameId) => {
    // 1. Parse roundId, skipGoal (optional)
    // 2. Get round and solutions
    // 3. Check round is active
    // 4. If skipGoal=false:
    //    - Add goalIndex to completedGoalIndices
    //    - Update robots to winning solution positions
    // 5. Update round.status ('completed' or 'skipped')
    // 6. Clear game.currentRoundId
    // 7. Return summary
  })
});
```

#### 3. dashboard

```javascript
app.http('hostDashboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: requireHostAuth(async (request, context, gameId) => {
    // 1. Get game
    // 2. Get current round (if exists)
    // 3. Get recent rounds (last 10)
    // 4. Calculate statistics
    // 5. Return dashboard data
  })
});
```

#### Success Criteria
- ✅ All three endpoints work
- ✅ Proper host authentication
- ✅ Skip functionality correct
- ✅ Dashboard stats accurate
- ✅ Matches API specification
- ✅ Tests pass

---

### Task 11: Timer Function - checkRoundEnd
**Estimated Time:** 45 minutes  
**Priority:** Medium  
**Dependencies:** Tasks 2, 9

#### What to Build
**File:** `api/checkRoundEnd/index.js`

Time-triggered function running every 1 minute.

#### Implementation

```javascript
const { app } = require('@azure/functions');

app.timer('checkRoundEnd', {
  schedule: '0 * * * * *', // Every minute
  handler: async (myTimer, context) => {
    // 1. Get all active rounds (cross-partition query)
    // 2. Check endTime < currentTime
    // 3. For each expired round:
    //    - Get solutions
    //    - If solutions exist:
    //      - Find winning solution (lowest moves)
    //      - Update robots to final positions
    //      - Add to completedGoalIndices
    //    - Update round.status = 'completed'
    //    - Clear game.currentRoundId
    //    - Log event
  }
});
```

#### Logging

```javascript
context.log({
  timestamp: Date.now(),
  event: 'round_ended',
  gameId,
  roundId,
  goalIndex,
  solutionCount,
  winningMoveCount,
  endReason: 'timer'
});
```

#### Success Criteria
- ✅ Runs on schedule
- ✅ Finds expired rounds
- ✅ Updates game state correctly
- ✅ Handles no-solution case
- ✅ Logging works
- ✅ Integration tests pass

---

### Task 12: CORS Configuration
**Estimated Time:** 15 minutes  
**Priority:** Low  
**Dependencies:** None

#### What to Build
**File:** `api/host.json` (update)

Configure CORS for frontend access.

#### Configuration

```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[3.*, 4.0.0)"
  },
  "extensions": {
    "http": {
      "routePrefix": "api",
      "cors": {
        "allowedOrigins": [
          "http://localhost:3000",
          "http://localhost:5500",
          "https://ricochet-robots.azurewebsites.net"
        ],
        "supportCredentials": false
      }
    }
  }
}
```

#### Success Criteria
- ✅ CORS configured
- ✅ Local development works
- ✅ Production domain allowed
- ✅ Preflight requests handled

---

### Task 13: Integration Testing
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** All previous tasks

#### What to Build
**File:** `tests/api/integration.test.js`

End-to-end API tests with Azurite.

#### Test Scenarios

1. **Full Game Lifecycle:**
   ```javascript
   // 1. Create game
   // 2. Start round
   // 3. Submit solutions (multiple players)
   // 4. Get leaderboard
   // 5. End round
   // 6. Start round 2
   // 7. Complete all 17 rounds
   // 8. Verify game completion
   ```

2. **Error Scenarios:**
   - Invalid host key
   - Duplicate submission
   - Invalid solution
   - Round already active
   - All goals exhausted

3. **Edge Cases:**
   - Skip round functionality
   - Extend deadline
   - Multi-color goal
   - No solutions submitted

#### Test Utilities

```javascript
class TestClient {
  async createGame(data) { }
  async startRound(gameId, hostKey, duration) { }
  async submitSolution(gameId, roundId, playerName, solution) { }
  async getLeaderboard(gameId, roundId) { }
  async endRound(gameId, roundId, hostKey, skip) { }
}
```

#### Success Criteria
- ✅ All integration tests pass
- ✅ Full game lifecycle works
- ✅ Error handling verified
- ✅ Multi-game isolation confirmed
- ✅ Test coverage >85%

---

## Summary

### Total Estimated Time: **12-14 hours**

### Task Dependencies

```
Task 1 (Setup)
  ↓
Task 2 (Storage) ← Task 3 (Auth) ← Task 4 (Validators)
  ↓                     ↓               ↓
Task 5 (getCurrentRound)              Task 8 (createGame)
Task 6 (getLeaderboard)                  ↓
Task 7 (submitSolution)              Task 9 (startRound)
  ↓                                      ↓
  └──────────────────────────→ Task 10 (Host endpoints)
                                         ↓
                                  Task 11 (Timer)
                                         ↓
                                  Task 12 (CORS)
                                         ↓
                                  Task 13 (Integration)
```

### Testing Strategy

1. **Unit Tests:** Each storage/auth/validation function
2. **Integration Tests:** Full API workflows with Azurite
3. **Manual Testing:** Postman/curl for endpoints
4. **Load Testing:** (Optional) Test concurrent requests

### Deployment Checklist

Before deploying to Azure:
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] CORS settings correct
- [ ] Connection strings for production storage
- [ ] Application Insights enabled
- [ ] Function timeout settings appropriate

### Next Steps After Phase 2

Once backend is complete and tested:
1. Deploy to Azure (Functions App + Storage Account)
2. Test production endpoints
3. Begin Phase 3 (Frontend UI)
4. Integration between frontend and backend APIs

### Key Principles

1. **Test with Azurite First:** Local storage emulator for development
2. **Error Handling:** Every endpoint has proper error responses
3. **Validation:** Server-side validation for all inputs
4. **Security:** Host key authentication for admin operations
5. **Documentation:** API matches specification exactly
6. **Logging:** Application Insights for monitoring
