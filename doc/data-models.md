# Async Ricochet Robots - Data Models

## Azure Table Storage Overview

Azure Table Storage is a NoSQL key-value store with the following characteristics:
- **Partition Key**: Primary grouping mechanism, used for scalability
- **Row Key**: Unique identifier within a partition
- **Properties**: Up to 252 properties per entity (we use far fewer)
- **Data Types**: String, Int32, Int64, Double, Boolean, DateTime, Binary, Guid

## Design Principles

1. **Partition Strategy**: Partition by gameId to isolate games and optimize queries
2. **Row Key Strategy**: Use descriptive identifiers (roundId, playerName) for easy lookups
3. **Data Serialization**: Complex objects stored as JSON strings
4. **Indexing**: Primary index is PartitionKey + RowKey (both required)

---

# Table: Games

Stores game metadata, host authentication keys, and board state.

## Schema

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| PartitionKey | String | Yes | Always "GAME" (all games in one partition) |
| RowKey | String | Yes | gameId (e.g., "game_abc123xyz") |
| hostKey | String | Yes | Secret key for host authentication (e.g., "host_9f8e7d6c5b4a") |
| gameName | String | No | Display name for the game |
| createdAt | Int64 | Yes | Unix timestamp (milliseconds) |
| defaultRoundDurationMs | Int64 | Yes | Default duration for rounds in milliseconds |
| currentRoundId | String | No | Reference to currently active round |
| totalRounds | Int32 | Yes | Counter of total rounds created |
| boardData | String | Yes | JSON string containing persistent board configuration |

## boardData JSON Structure

The board persists across all rounds in a game. Robots accumulate in their positions after each round.

```json
{
  "walls": {
    "horizontal": [
      [0, 5, 8],
      [1, 2, 15],
      // ... 16 arrays total (one per row)
    ],
    "vertical": [
      [0, 3, 7],
      [1, 1, 9, 14],
      // ... 16 arrays total (one per column)
    ]
  },
  "robots": {
    "red": { "x": 3, "y": 5 },
    "yellow": { "x": 12, "y": 2 },
    "green": { "x": 8, "y": 14 },
    "blue": { "x": 1, "y": 9 }
  },
  "allGoals": [
    { "position": { "x": 2, "y": 3 }, "color": "red" },
    { "position": { "x": 5, "y": 2 }, "color": "yellow" },
    { "position": { "x": 3, "y": 6 }, "color": "green" },
    { "position": { "x": 6, "y": 5 }, "color": "blue" },
    // ... 13 more goals (4 per quadrant = 16 total)
    { "position": { "x": 7, "y": 9 }, "color": "multi" }
    // Total: 17 goals
  ],
  "completedGoalIndices": [0, 3, 7, 12]
}
```

### boardData Notes

- **walls**: Generated once at game creation with 17 L-shaped pieces (one per goal), non-overlapping
- **robots**: Updated after each round to reflect final positions (persistent state)
- **allGoals**: Exactly 17 goals on the board (16 single-color + 1 multi-color placed randomly)
- **completedGoalIndices**: Array of indices into allGoals that have been completed
- Game ends when `completedGoalIndices.length === 17`
- **Tiebreaker**: If multiple solutions have same move count, earliest submission's robot positions are used

## Example Entity

```json
{
  "PartitionKey": "GAME",
  "RowKey": "game_abc123xyz",
  "hostKey": "host_9f8e7d6c5b4a",
  "gameName": "Friday Night Puzzle",
  "createdAt": 1704000000000,
  "defaultRoundDurationMs": 86400000,
  "currentRoundId": "round_1704067200000",
  "totalRounds": 5,
  "boardData": "{\"walls\":{\"horizontal\":[[0,5,8],...],\"vertical\":[[0,3,7],...]},\"robots\":{\"red\":{\"x\":3,\"y\":5},\"yellow\":{\"x\":12,\"y\":2},\"green\":{\"x\":8,\"y\":14},\"blue\":{\"x\":1,\"y\":9}},\"allGoals\":[{\"position\":{\"x\":2,\"y\":3},\"color\":\"red\"},...],\"completedGoalIndices\":[0,3,7,12]}",
  "Timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Indexes

- **Primary**: PartitionKey + RowKey
- **Query Patterns**:
  - Get game by ID: `PartitionKey = "GAME" AND RowKey = gameId`
  - List all games: `PartitionKey = "GAME"` (not typically needed)

## Notes

- All games share partition "GAME" - acceptable since we expect low total game count
- If scaling to thousands of games, consider partitioning by date or hash
- `hostKey` should be treated as a secret and only returned on game creation
- `boardData` is updated after each round to reflect new robot positions and completed goals

---

# Table: Rounds

Stores round metadata and goal selection for each game round.

## Schema

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| PartitionKey | String | Yes | gameId (e.g., "game_abc123xyz") |
| RowKey | String | Yes | roundId (e.g., "round_1704067200000") |
| roundNumber | Int32 | Yes | Sequential round number (1, 2, 3, ...) |
| goalIndex | Int32 | Yes | Index into boardData.allGoals array |
| goalColor | String | Yes | Color of goal ('red', 'yellow', 'green', 'blue', or 'multi') |
| goalPosition | String | Yes | JSON string: {"x": 7, "y": 7} |
| robotPositions | String | Yes | JSON string: robot positions at start of round |
| startTime | Int64 | Yes | Unix timestamp (milliseconds) |
| endTime | Int64 | Yes | Unix timestamp (milliseconds) |
| durationMs | Int64 | Yes | Round duration in milliseconds |
| status | String | Yes | "active", "completed", or "skipped" |
| createdBy | String | Yes | "host" or "timer" |

## goalPosition JSON Structure

```json
{
  "x": 7,
  "y": 7
}
```

## robotPositions JSON Structure

Robot positions at the START of this round (snapshot for replay purposes):

```json
{
  "red": { "x": 3, "y": 5 },
  "yellow": { "x": 12, "y": 2 },
  "green": { "x": 8, "y": 14 },
  "blue": { "x": 1, "y": 9 }
}
```

## Example Entity

```json
{
  "PartitionKey": "game_abc123xyz",
  "RowKey": "round_1704067200000",
  "roundNumber": 1,
  "goalIndex": 5,
  "goalColor": "red",
  "goalPosition": "{\"x\":7,\"y\":7}",
  "robotPositions": "{\"red\":{\"x\":3,\"y\":5},\"yellow\":{\"x\":12,\"y\":2},\"green\":{\"x\":8,\"y\":14},\"blue\":{\"x\":1,\"y\":9}}",
  "startTime": 1704067200000,
  "endTime": 1704153600000,
  "durationMs": 86400000,
  "status": "active",
  "createdBy": "host",
  "Timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Round Status Values

- **active**: Round in progress, accepting solutions
- **completed**: Round finished, goal successfully solved
- **skipped**: Round ended by host without completion (goal returns to available pool)

## Indexes

- **Primary**: PartitionKey + RowKey
- **Query Patterns**:
  - Get specific round: `PartitionKey = gameId AND RowKey = roundId`
  - Get all rounds for game: `PartitionKey = gameId`
  - Get active round: `PartitionKey = gameId AND status = "active"` (filter)
  - Timer function: Query all partitions where `status = "active" AND endTime < now` (expensive, but runs infrequently)

## Notes

- Rounds partitioned by gameId ensures game isolation
- Round does NOT store walls (always use boardData.walls from Game entity)
- `goalColor` determines win condition: 'multi' means any robot can win
- `robotPositions` snapshot allows accurate solution replay even if board state changes
- Timer function must scan all active rounds across all games (acceptable for small scale)

---

# Table: Solutions

Stores player solutions for each round.

## Schema

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| PartitionKey | String | Yes | Composite key: "gameId_roundId" |
| RowKey | String | Yes | playerName (normalized: lowercase, trimmed) |
| displayName | String | Yes | Original player name (for display) |
| moveCount | Int32 | Yes | Number of moves in solution |
| winningRobot | String | Yes | Robot that reached goal ('red', 'yellow', 'green', 'blue') |
| solutionData | String | Yes | JSON string array of moves |
| submittedAt | Int64 | Yes | Unix timestamp (milliseconds) |

## solutionData JSON Structure

```json
[
  { "robot": "blue", "direction": "up" },
  { "robot": "red", "direction": "right" },
  { "robot": "blue", "direction": "right" },
  { "robot": "red", "direction": "down" },
  { "robot": "red", "direction": "right" },
  { "robot": "yellow", "direction": "left" },
  { "robot": "red", "direction": "up" }
]
```

## Example Entity

```json
{
  "PartitionKey": "game_abc123xyz_round_1704067200000",
  "RowKey": "alice",
  "displayName": "Alice",
  "moveCount": 7,
  "winningRobot": "red",
  "solutionData": "[{\"robot\":\"blue\",\"direction\":\"up\"},{\"robot\":\"red\",\"direction\":\"right\"},{\"robot\":\"blue\",\"direction\":\"right\"},{\"robot\":\"red\",\"direction\":\"down\"},{\"robot\":\"red\",\"direction\":\"right\"},{\"robot\":\"yellow\",\"direction\":\"left\"},{\"robot\":\"red\",\"direction\":\"up\"}]",
  "submittedAt": 1704070000000,
  "Timestamp": "2024-01-01T12:46:40.000Z"
}
```

## Multi-Color Goal Solutions

For multi-color goals, different players may win with different robots:

```json
// Alice's solution
{
  "displayName": "Alice",
  "moveCount": 7,
  "winningRobot": "red",
  // ...
}

// Bob's solution
{
  "displayName": "Bob",
  "moveCount": 8,
  "winningRobot": "blue",
  // ...
}
```

Both solutions are valid for a multi-color goal. Leaderboard shows which robot each player used.

## Indexes

- **Primary**: PartitionKey + RowKey
- **Query Patterns**:
  - Get all solutions for round: `PartitionKey = "gameId_roundId"`
  - Get specific player's solution: `PartitionKey = "gameId_roundId" AND RowKey = playerName`
  - Check if player submitted: Same as above

## Uniqueness Constraint

- PartitionKey + RowKey combination enforces one solution per player per round
- Attempting to insert duplicate throws error (409 Conflict in API)
- Updates are not allowed (solutions are immutable once submitted)

## Notes

- Solutions partitioned by gameId_roundId for efficient leaderboard queries
- All solutions for a round retrieved in single partition query
- playerName normalized to prevent case-sensitivity issues ("Alice" vs "alice")
- displayName preserves user's preferred capitalization
- `winningRobot` tracks which robot actually reached the goal (important for multi-color goals)

---

# Query Patterns & Performance

## Common Queries

### 1. Get Game and Board State
```javascript
// Query: Games table
PartitionKey = "GAME"
RowKey = gameId
Expected Results: 1 entity
Performance: Fast (direct lookup)
Returns: boardData with walls, robots, all goals, completed indices
```

### 2. Get Current Round for Game
```javascript
// Query: Rounds table
PartitionKey = gameId
Filter: status = "active"
Expected Results: 0-1 entities
Performance: Fast (single partition, small result set)
```

### 3. Create New Round
```javascript
// Step 1: Get game (retrieve boardData)
// Step 2: Check completedGoalIndices.length < 17
// Step 3: Select random goalIndex from available (not in completedGoalIndices)
// Step 4: Insert Round entity with selected goal
// Step 5: Update Game.currentRoundId
Performance: Fast (2 reads, 2 writes)
```

### 4. Get Leaderboard
```javascript
// Query: Solutions table
PartitionKey = gameId_roundId
Expected Results: 0-100 entities
Performance: Fast (single partition)
Client-side: Sort by moveCount, then submittedAt
Display: Include winningRobot in leaderboard
```

### 5. Submit Solution
```javascript
// Step 1: Validate solution (server-side game engine)
// Step 2: Insert Solutions entity
// Step 3: If round completed, update Rounds.status and Game.boardData
//         - Add goalIndex to completedGoalIndices
//         - Update robots to final positions
Performance: Fast (validation + single entity insert + conditional update)
```

### 6. Skip Round (Host Action)
```javascript
// Step 1: Update Rounds.status = "skipped"
// Step 2: Update Game.currentRoundId = null
// Note: goalIndex NOT added to completedGoalIndices (stays available)
Performance: Fast (2 entity updates)
```

### 7. Timer Function (Check Round End)
```javascript
// Query: Rounds table
// Scan all partitions where status = "active"
Filter: endTime < currentTime
Expected Results: 0-50 entities (across all games)
Performance: Slower (cross-partition), but runs infrequently (every 1 min)
```

### 8. Check Game Completion
```javascript
// Query: Games table
PartitionKey = "GAME"
RowKey = gameId
Parse: boardData.completedGoalIndices
Check: completedGoalIndices.length === 17
Result: If true, game is complete (cannot create more rounds)
Performance: Fast (single entity read)
```

### 9. Host Dashboard
```javascript
// Query 1: Games table
PartitionKey = "GAME"
RowKey = gameId

// Query 2: Rounds table
PartitionKey = gameId
Sort by: roundNumber descending
Limit: Last 10 rounds

// Query 3: Solutions table (for each recent round)
PartitionKey = gameId_roundId
Aggregate: Count, min moveCount

Performance: Moderate (multiple queries, but acceptable for dashboard)
Display: Show completed goals (17 - completedGoalIndices.length remaining)
```

## Optimization Strategies

### Current Scale (< 100 concurrent games)
- Current schema is optimal
- All queries are efficient
- No additional indexes needed

### Future Scale (> 1000 games)
1. **Games Table**: Partition by date or hash instead of single "GAME" partition
2. **Timer Function**: Add secondary index on status + endTime
3. **Caching**: Cache active rounds in Redis for 1-minute TTL
4. **Archival**: Move completed rounds older than 30 days to blob storage

---

# Data Lifecycle

## Creation Flow

```
1. Host creates game
   → Insert into Games table with new boardData
   → boardData contains: walls (17 L-shapes), robots (initial positions), 
     allGoals (17 goals), completedGoalIndices ([])

2. Host starts round
   → Check completedGoalIndices.length < 17
   → Select random goalIndex from incomplete goals
   → Insert into Rounds table with goalIndex, goalColor, goalPosition
   → Update Games.currentRoundId

3. Player submits solution
   → Validate solution with game engine
   → Insert into Solutions table with winningRobot
   → No change to Game.boardData yet (robots still in original positions)

4. Round ends (timer or manual)
   → Update Rounds.status = "completed" or "skipped"
   → If completed: Add goalIndex to completedGoalIndices
   → Update Game.boardData.robots to final positions from winning solution
   → Update Games.currentRoundId = null

5. Check game completion
   → If completedGoalIndices.length === 17: game ends
   → Cannot create more rounds (return error)
```

## Goal Lifecycle

```
Board Creation:
  → 17 goals generated (indices 0-16)
  → completedGoalIndices = []

Round 1:
  → Select random from [0-16]
  → If completed: completedGoalIndices = [5]

Round 2:
  → Select random from [0-4, 6-16] (exclude 5)
  → If skipped: completedGoalIndices = [5] (unchanged)

Round 3:
  → Select random from [0-4, 6-16] (same pool, skip didn't consume goal)
  → If completed: completedGoalIndices = [5, 12]

...continue until completedGoalIndices.length === 17
```

## Retention Policy

- **Games**: Persist indefinitely (or until manual deletion)
- **Rounds**: Persist indefinitely for history
- **Solutions**: Persist indefinitely for history

### Optional Archival (Future Enhancement)
- Archive rounds/solutions older than 90 days to blob storage
- Keep metadata in Tables for quick queries
- Retrieve from blob storage for detailed history

---

# Data Size Estimates

## Per Entity

| Entity | Avg Size | Notes |
|--------|----------|-------|
| Game | 6 KB | boardData JSON is ~5 KB (walls + 17 goals) |
| Round | 1 KB | Minimal data, references board in Game entity |
| Solution | 800 bytes | solutionData JSON is ~500 bytes |

## Per Game (17 rounds, 20 players/round)

```
1 Game entity:                     6,000 bytes (6 KB)
17 Round entities:                17,000 bytes (17 KB)
340 Solution entities:           272,000 bytes (272 KB)
Total per game:                  295,000 bytes (~295 KB)
```

## Storage Costs (100 games)

```
Total data: 100 games × 295 KB = 29.5 MB
Azure Table Storage: $0.05/GB/month
Monthly cost: 0.0295 GB × $0.05 = $0.0015 (~$0.002)
```

**Conclusion:** Storage costs are negligible.

---

# Migration Strategy

Since Azure Table Storage is schema-less, migrations are simple:

## Adding New Property
```javascript
// No migration needed!
// New entities include new property
// Old entities return undefined for property
// Handle in application code
```

## Renaming Property
```javascript
// 1. Deploy code that reads both old and new property names
// 2. Run script to copy old→new for all entities
// 3. Deploy code that only uses new property
// 4. Optionally delete old property
```

## Changing Data Type
```javascript
// 1. Add new property with correct type
// 2. Migrate data
// 3. Switch code to new property
// 4. Delete old property
```

---

# Backup & Recovery

## Azure Built-in Features
- **Geo-redundant Storage**: Data replicated across regions
- **Point-in-time Restore**: Not available for Table Storage

## Manual Backup Strategy
```javascript
// Export to blob storage daily
async function backupTables() {
  const tables = ['Games', 'Rounds', 'Solutions'];
  for (const table of tables) {
    const entities = await queryAll(table);
    await uploadToBlob(`backup/${table}-${date}.json`, entities);
  }
}
```

## Recovery
```javascript
// Re-import from blob storage
async function restoreTable(tableName, date) {
  const backup = await downloadFromBlob(`backup/${tableName}-${date}.json`);
  for (const entity of backup) {
    await tableClient.createEntity(entity);
  }
}
```

---

# Security Considerations

## Connection Strings
- Store in Azure Key Vault or Function App Settings
- Never commit to source control
- Rotate periodically

## Data Encryption
- **At Rest**: Automatic encryption by Azure
- **In Transit**: HTTPS required for all operations

## Access Control
- Use Shared Access Signatures (SAS) for limited access
- Function App uses Managed Identity to access storage
- No direct table access from client

## Data Validation
- Server-side validation before insert
- Sanitize all user inputs (player names, etc.)
- Validate JSON structure before storing

---

# Example Code

## Inserting a Game with Board

```javascript
const { TableClient } = require('@azure/data-tables');

const tableClient = TableClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING,
  'Games'
);

// Generate puzzle with 17 goals
const puzzle = generatePuzzle(); // From puzzle-generator module

const boardData = {
  walls: puzzle.walls,
  robots: puzzle.robots,
  allGoals: puzzle.allGoals,
  completedGoalIndices: []
};

const gameEntity = {
  partitionKey: 'GAME',
  rowKey: `game_${generateId()}`,
  hostKey: `host_${generateSecureToken()}`,
  gameName: 'Friday Night Puzzle',
  createdAt: Date.now(),
  defaultRoundDurationMs: 86400000,
  currentRoundId: null,
  totalRounds: 0,
  boardData: JSON.stringify(boardData)
};

await tableClient.createEntity(gameEntity);
```

## Creating a Round with Goal Selection

```javascript
// Get game to access boardData
const game = await gamesTable.getEntity('GAME', gameId);
const board = JSON.parse(game.boardData);

// Check if game complete
if (board.completedGoalIndices.length >= 17) {
  throw new Error('All goals exhausted. This game has completed all 17 rounds.');
}

// Find available goals
const availableIndices = [];
for (let i = 0; i < 17; i++) {
  if (!board.completedGoalIndices.includes(i)) {
    availableIndices.push(i);
  }
}

// Select random available goal
const goalIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
const goal = board.allGoals[goalIndex];

// Create round
const roundEntity = {
  partitionKey: gameId,
  rowKey: `round_${Date.now()}`,
  roundNumber: game.totalRounds + 1,
  goalIndex: goalIndex,
  goalColor: goal.color,
  goalPosition: JSON.stringify(goal.position),
  robotPositions: JSON.stringify(board.robots),
  startTime: Date.now(),
  endTime: Date.now() + game.defaultRoundDurationMs,
  durationMs: game.defaultRoundDurationMs,
  status: 'active',
  createdBy: 'host'
};

await roundsTable.createEntity(roundEntity);
```

## Validating and Storing Solution

```javascript
const { validateSolution } = require('./game-engine');

// Get game board and round data
const game = await gamesTable.getEntity('GAME', gameId);
const round = await roundsTable.getEntity(gameId, roundId);
const board = JSON.parse(game.boardData);

// Validate solution
const validation = validateSolution({
  walls: board.walls,
  robots: JSON.parse(round.robotPositions),
  goalPosition: JSON.parse(round.goalPosition),
  goalColor: round.goalColor
}, solutionData);

if (!validation.valid) {
  return { status: 400, body: { error: validation.error } };
}

// Store solution
const solutionEntity = {
  partitionKey: `${gameId}_${roundId}`,
  rowKey: playerName.toLowerCase().trim(),
  displayName: playerName,
  moveCount: validation.moveCount,
  winningRobot: validation.winningRobot,
  solutionData: JSON.stringify(solutionData),
  submittedAt: Date.now()
};

await solutionsTable.createEntity(solutionEntity);
```

## Completing a Round

```javascript
// Mark round as completed
await roundsTable.updateEntity({
  partitionKey: gameId,
  rowKey: roundId,
  status: 'completed'
}, 'Merge');

// Update game board: add to completedGoalIndices and update robot positions
const game = await gamesTable.getEntity('GAME', gameId);
const board = JSON.parse(game.boardData);
const round = await roundsTable.getEntity(gameId, roundId);

// Get winning solution (lowest move count)
const solutions = await getSolutionsForRound(gameId, roundId);
const winningSolution = solutions.sort((a, b) => 
  a.moveCount !== b.moveCount ? a.moveCount - b.moveCount : a.submittedAt - b.submittedAt
)[0];

// Execute winning solution to get final robot positions
const finalRobots = executeAllMoves(
  board.walls,
  JSON.parse(round.robotPositions),
  JSON.parse(winningSolution.solutionData)
);

// Update board
board.completedGoalIndices.push(round.goalIndex);
board.robots = finalRobots;

await gamesTable.updateEntity({
  partitionKey: 'GAME',
  rowKey: gameId,
  boardData: JSON.stringify(board),
  currentRoundId: null
}, 'Merge');
```

## Skipping a Round

```javascript
// Mark round as skipped (goal stays available)
await roundsTable.updateEntity({
  partitionKey: gameId,
  rowKey: roundId,
  status: 'skipped'
}, 'Merge');

// Clear current round
await gamesTable.updateEntity({
  partitionKey: 'GAME',
  rowKey: gameId,
  currentRoundId: null
}, 'Merge');

// Note: goalIndex NOT added to completedGoalIndices
// Goal can be selected again in future rounds
```

## Querying Solutions for Leaderboard

```javascript
const { TableClient } = require('@azure/data-tables');

const tableClient = TableClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING,
  'Solutions'
);

const partitionKey = `${gameId}_${roundId}`;
const solutions = [];

const entities = tableClient.listEntities({
  queryOptions: { filter: `PartitionKey eq '${partitionKey}'` }
});

for await (const entity of entities) {
  solutions.push({
    playerName: entity.displayName,
    moveCount: entity.moveCount,
    winningRobot: entity.winningRobot,
    submittedAt: entity.submittedAt,
    solutionData: JSON.parse(entity.solutionData)
  });
}

// Sort by moveCount, then by submittedAt
solutions.sort((a, b) => {
  if (a.moveCount !== b.moveCount) return a.moveCount - b.moveCount;
  return a.submittedAt - b.submittedAt;
});
```

## Checking Round Expiration (Timer Function)

```javascript
const { TableClient } = require('@azure/data-tables');

const tableClient = TableClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING,
  'Rounds'
);

const now = Date.now();
const filter = `status eq 'active' and endTime lt ${now}`;

const expiredRounds = tableClient.listEntities({
  queryOptions: { filter }
});

for await (const round of expiredRounds) {
  // Update status to completed
  await tableClient.updateEntity({
    partitionKey: round.partitionKey,
    rowKey: round.rowKey,
    status: 'completed'
  }, 'Merge');
  
  console.log(`Round ${round.rowKey} expired and completed`);
}
