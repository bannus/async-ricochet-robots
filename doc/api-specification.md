# Async Ricochet Robots - API Specification

## Base URL

**Development:** `http://localhost:7071/api`  
**Production:** `https://ricochet-robots-api.azurewebsites.net/api`

## Authentication

### Host Authentication
Host endpoints require authentication via headers:
- `X-Game-Id`: The game identifier
- `X-Host-Key`: The secret host key for the game

### Player Endpoints
No authentication required. Players are identified by username only.

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

## Common Error Codes

- `GAME_NOT_FOUND`: Specified game does not exist
- `ROUND_NOT_FOUND`: Specified round does not exist
- `INVALID_HOST_KEY`: Host authentication failed
- `ROUND_ENDED`: Cannot submit solution to ended round
- `INVALID_SOLUTION`: Solution does not reach goal
- `VALIDATION_ERROR`: Input validation failed
- `ALL_GOALS_EXHAUSTED`: All 17 goals completed, game is finished

---

# Player Endpoints

## GET /api/getCurrentRound

Get the current active round for a game, including the persistent board state.

### Query Parameters
- `gameId` (required): Game identifier

### Request Example
```http
GET /api/getCurrentRound?gameId=game_abc123xyz
```

### Response 200 (Active Round)
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "gameName": "Friday Night Puzzle",
    "roundId": "game_abc123xyz_round5",
    "roundNumber": 5,
    "puzzle": {
      "walls": {
        "horizontal": [
          [0, 5, 8],
          [1, 2, 15],
          [2, 7, 12],
          // ... 16 rows total
        ],
        "vertical": [
          [0, 3, 7],
          [1, 1, 9, 14],
          [2, 4, 8, 13],
          // ... 16 columns total
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
        // ... 12 more single-color goals (4 per quadrant)
        { "position": { "x": 7, "y": 9 }, "color": "multi" }
        // Total: 17 goals (16 single-color + 1 multi-color, randomly placed)
      ],
      "goalColor": "red",
      "goalPosition": { "x": 7, "y": 7 },
      "completedGoalIndices": [0, 3, 7, 12]
    },
    "startTime": 1704067200000,
    "endTime": 1704153600000,
    "durationMs": 86400000,
    "status": "active",
    "goalsRemaining": 13
  }
}
```

### Response 200 (Between Rounds - Last Completed Round)
When no active round exists but a completed round is available for replay:

```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "gameName": "Friday Night Puzzle",
    "roundId": "game_abc123xyz_round4",
    "roundNumber": 4,
    "puzzle": {
      "walls": { /* same structure as active round */ },
      "robots": {
        "red": { "x": 3, "y": 5 },
        "yellow": { "x": 12, "y": 2 },
        "green": { "x": 8, "y": 14 },
        "blue": { "x": 1, "y": 9 }
      },
      "allGoals": [ /* all 17 goals */ ],
      "goalColor": "red",
      "goalPosition": { "x": 7, "y": 7 },
      "completedGoalIndices": [0, 3, 7, 12]
    },
    "startTime": 1704067200000,
    "endTime": 1704153600000,
    "durationMs": 86400000,
    "status": "completed",
    "hasActiveRound": false,
    "goalsCompleted": 4,
    "goalsRemaining": 13,
    "message": "Round complete - waiting for next round"
  }
}
```

**Note:** Robot positions reflect the **starting positions** for that round (before any solutions were applied). This allows for solution replay functionality.

### Response 200 (No Rounds Yet)
When no active round exists and no completed rounds are available:

```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "gameName": "Friday Night Puzzle",
    "hasActiveRound": false,
    "message": "No active round. Waiting for host to start next round.",
    "goalsCompleted": 0,
    "goalsRemaining": 17
  }
}
```

### Response 200 (Game Complete)
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "gameName": "Friday Night Puzzle",
    "hasActiveRound": false,
    "gameComplete": true,
    "message": "This game has completed all 17 rounds!",
    "totalRoundsPlayed": 17,
    "goalsCompleted": 17
  }
}
```

### Response 404 (Game Not Found)
```json
{
  "success": false,
  "error": "Game not found",
  "code": "GAME_NOT_FOUND"
}
```

### Puzzle Details

- **walls**: Same for all rounds (generated at game creation with 17 L-shaped pieces)
- **robots**: Current positions (persist between rounds, updated after each completion)
- **allGoals**: All 17 goal positions on the board (faded in UI, active one highlighted)
- **goalColor**: Color for this round ('red', 'yellow', 'green', 'blue', or 'multi')
- **goalPosition**: Active goal position for this round
- **completedGoalIndices**: Array indices of completed goals (used internally)

### Multi-Color Goals

When `goalColor` is `"multi"`, ANY robot reaching the goal position wins:
- Players can choose any robot to solve
- Different players may use different robots
- Leaderboard shows which robot each player used

### Wall Format Details
- `horizontal[row]` = Array of column indices where horizontal walls exist BELOW that row
- `vertical[col]` = Array of row indices where vertical walls exist TO THE RIGHT of that column
- Grid coordinates: (0,0) is top-left, (15,15) is bottom-right
- Outer boundary walls are implicit (not stored in data)

---

## GET /api/getLeaderboard

Get the ranked leaderboard for a specific round.

### Query Parameters
- `gameId` (required): Game identifier
- `roundId` (required): Round identifier (format: `{gameId}_round{number}`)

### Request Example
```http
GET /api/getLeaderboard?gameId=game_abc123xyz&roundId=game_abc123xyz_round1
```

### Response 200 (No Solutions Yet)
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "roundId": "game_abc123xyz_round1",
    "roundNumber": 5,
    "roundStatus": "active",
    "solutions": [],
    "totalSolutions": 0,
    "message": "No solutions submitted yet"
  }
}
```

### Response 200 (Active Round with Solutions)
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "roundId": "game_abc123xyz_round1",
    "roundNumber": 5,
    "goalColor": "multi",
    "roundStatus": "active",
    "roundEnded": false,
    "solutions": [
      {
        "playerName": "Alice",
        "submissionNumber": 1,
        "moveCount": 7,
        "winningRobot": "red",
        "submittedAt": 1704070000000,
        "rank": 1
      },
      {
        "playerName": "Alice",
        "submissionNumber": 2,
        "moveCount": 9,
        "winningRobot": "blue",
        "submittedAt": 1704071000000,
        "rank": 4
      },
      {
        "playerName": "Bob",
        "submissionNumber": 1,
        "moveCount": 8,
        "winningRobot": "blue",
        "submittedAt": 1704072000000,
        "rank": 2
      },
      {
        "playerName": "Charlie",
        "submissionNumber": 1,
        "moveCount": 8,
        "winningRobot": "red",
        "submittedAt": 1704073000000,
        "rank": 2
      }
    ]
  }
}
```

### Response 200 (Completed Round)
When round has ended, solution data is included:

```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "roundId": "game_abc123xyz_round5",
    "roundNumber": 5,
    "goalColor": "multi",
    "roundStatus": "completed",
    "roundEnded": true,
    "endTime": 1704153600000,
    "solutions": [
      {
        "playerName": "Alice",
        "submissionNumber": 1,
        "moveCount": 7,
        "winningRobot": "red",
        "submittedAt": 1704070000000,
        "rank": 1,
        "moves": [
          { "robot": "blue", "direction": "up" },
          { "robot": "red", "direction": "right" },
          { "robot": "blue", "direction": "right" },
          { "robot": "red", "direction": "down" },
          { "robot": "red", "direction": "right" },
          { "robot": "yellow", "direction": "left" },
          { "robot": "red", "direction": "up" }
        ]
      },
      {
        "playerName": "Alice",
        "submissionNumber": 2,
        "moveCount": 9,
        "winningRobot": "blue",
        "submittedAt": 1704071000000,
        "rank": 4,
        "moves": [
          { "robot": "blue", "direction": "down" },
          { "robot": "blue", "direction": "right" },
          // ... 7 more moves
        ]
      }
      // ... other solutions with moves
    ]
  }
}
```

### Ranking Rules
- ALL submissions ranked by move count (ascending)
- Same player can appear multiple times with different submissions
- Ties: Submissions with same move count share the same rank
- Submission time is tiebreaker for display order only
- For multi-color goals: `winningRobot` shows which robot reached goal
- `submissionNumber`: Sequential number (1, 2, 3...) indicating which attempt this represents for that player

---

## POST /api/submitSolution

Submit a solution for the current round.

### Request Body
```json
{
  "gameId": "game_abc123xyz",
  "roundId": "game_abc123xyz_round1",
  "playerName": "Alice",
  "solutionData": [
    { "robot": "blue", "direction": "up" },
    { "robot": "red", "direction": "right" },
    { "robot": "blue", "direction": "right" },
    { "robot": "red", "direction": "down" },
    { "robot": "red", "direction": "right" },
    { "robot": "yellow", "direction": "left" },
    { "robot": "red", "direction": "up" }
  ]
}
```

### Solution Data Format
- Array of moves in sequential order
- Each move object:
  - `robot`: `"red"`, `"yellow"`, `"green"`, or `"blue"`
  - `direction`: `"up"`, `"down"`, `"left"`, or `"right"`

### Validation Rules
- Player name: 1-20 characters, alphanumeric + spaces
- Solution must be non-empty
- All moves must have valid robot and direction
- Solution must be verified server-side (goal reached)
- For single-color goals: Specific robot must reach goal
- For multi-color goals: ANY robot reaching goal is valid

### Response 200 (Success - First Submission)
```json
{
  "success": true,
  "data": {
    "message": "Solution #1 submitted successfully!",
    "solution": {
      "playerName": "Alice",
      "moveCount": 7,
      "winningRobot": "red",
      "submittedAt": 1704070000000,
      "submissionNumber": 1,
      "rank": 1,
      "totalSolutions": 1
    },
    "leaderboard": {
      "yourRank": 1,
      "totalSubmissions": 1,
      "topScore": 7,
      "yourScore": 7,
      "yourSubmissionCount": 1,
      "achievement": "Current leader! 🏆"
    }
  }
}
```

### Response 200 (Success - Subsequent Submission)
```json
{
  "success": true,
  "data": {
    "message": "Solution #2 submitted successfully!",
    "solution": {
      "playerName": "Alice",
      "moveCount": 9,
      "winningRobot": "blue",
      "submittedAt": 1704071000000,
      "submissionNumber": 2,
      "rank": 4,
      "totalSolutions": 5
    },
    "leaderboard": {
      "yourRank": 4,
      "totalSubmissions": 5,
      "topScore": 7,
      "yourScore": 9,
      "yourSubmissionCount": 2
    }
  }
}
```

### Response 400 (Invalid Solution)
```json
{
  "success": false,
  "error": "Solution does not reach the goal. Final position: (5, 7), Goal: (7, 7)",
  "code": "INVALID_SOLUTION"
}
```

### Response 400 (Wrong Robot for Single-Color Goal)
```json
{
  "success": false,
  "error": "Red robot must reach the goal, but blue robot reached it instead",
  "code": "INVALID_SOLUTION"
}
```

### Response 400 (Round Ended)
```json
{
  "success": false,
  "error": "This round has ended. Solutions are no longer accepted.",
  "code": "ROUND_ENDED"
}
```

### Multiple Submissions Allowed
Players can submit multiple solutions per round. Each submission:
- Gets a unique sequential number (1st, 2nd, 3rd attempt)
- Is independently ranked on the leaderboard
- Can improve or worsen the player's standing
- All submissions remain visible on the leaderboard

---

# Game Management

## POST /api/createGame

Create a new game instance with a complete board containing 17 goals.

### Request Body
```json
{
  "gameName": "Friday Night Puzzle",
  "defaultRoundDurationMs": 86400000
}
```

### Request Body Parameters
- `gameName` (optional): Display name for the game (default: "Ricochet Robots Game")
- `defaultRoundDurationMs` (optional): Default duration for rounds in milliseconds (default: 86400000 = 24 hours)

### Response 200
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "hostKey": "host_9f8e7d6c5b4a",
    "gameName": "Friday Night Puzzle",
    "defaultRoundDurationMs": 86400000,
    "createdAt": 1704000000000,
    "totalGoals": 17,
    "goalsCompleted": 0,
    "gameUrl": "https://ricochet-robots.azurewebsites.net/?game=game_abc123xyz",
    "hostUrl": "https://ricochet-robots.azurewebsites.net/host.html?game=game_abc123xyz&key=host_9f8e7d6c5b4a",
    "message": "Game created successfully! Save your host key - you'll need it to manage rounds. This board has 17 goals and will support up to 17 rounds."
  }
}
```

### Important Notes
- **Save the hostKey!** It cannot be retrieved later
- Host URL includes both gameId and hostKey for easy access
- Game URL (for players) only includes gameId
- Board is generated once with 17 goals and persists for all rounds
- Game ends after 17 goals are completed

---

# Host Endpoints

All host endpoints require authentication headers:
- `X-Game-Id`: Game identifier
- `X-Host-Key`: Secret host key

## POST /api/host/startRound

Start a new round by selecting an incomplete goal from the board.

### Headers
```http
X-Game-Id: game_abc123xyz
X-Host-Key: host_9f8e7d6c5b4a
```

### Request Body
```json
{
  "durationMs": 86400000
}
```

### Request Body Parameters
- `durationMs` (optional): Duration for this round in milliseconds. If not provided, uses game's default duration.

### Response 200
```json
{
  "success": true,
  "data": {
    "roundId": "game_abc123xyz_round1",
    "roundNumber": 1,
    "goalIndex": 5,
    "goalColor": "red",
    "goalPosition": { "x": 7, "y": 7 },
    "robots": {
      "red": { "x": 3, "y": 5 },
      "yellow": { "x": 12, "y": 2 },
      "green": { "x": 8, "y": 14 },
      "blue": { "x": 1, "y": 9 }
    },
    "startTime": 1704067200000,
    "endTime": 1704153600000,
    "durationMs": 86400000,
    "status": "active",
    "goalsCompleted": 0,
    "goalsRemaining": 17,
    "message": "Round started successfully!"
  }
}
```

### Response 200 (Multi-Color Goal Selected)
```json
{
  "success": true,
  "data": {
    "roundId": "game_abc123xyz_round8",
    "roundNumber": 8,
    "goalIndex": 16,
    "goalColor": "multi",
    "goalPosition": { "x": 7, "y": 9 },
    "robots": { /* current positions */ },
    "startTime": 1704067200000,
    "endTime": 1704153600000,
    "durationMs": 86400000,
    "status": "active",
    "goalsCompleted": 7,
    "goalsRemaining": 10,
    "message": "Round started successfully! Multi-color goal - any robot can win."
  }
}
```

### Response 400 (Round Already Active)
```json
{
  "success": false,
  "error": "A round is already active. End it before starting a new one.",
  "code": "ROUND_ALREADY_ACTIVE",
  "currentRoundId": "game_abc123xyz_round1"
}
```

### Response 400 (All Goals Exhausted)
```json
{
  "success": false,
  "error": "All goals exhausted. This game has completed all 17 rounds. Please create a new game.",
  "code": "ALL_GOALS_EXHAUSTED",
  "goalsCompleted": 17,
  "totalRoundsPlayed": 17
}
```

### Response 401 (Invalid Host Key)
```json
{
  "success": false,
  "error": "Invalid host key",
  "code": "INVALID_HOST_KEY"
}
```

### Goal Selection Logic
- Random selection from incomplete goals (not in `completedGoalIndices`)
- Skipped goals remain available for future rounds
- Robot positions reflect accumulated state from previous rounds
- Game ends when all 17 goals are completed

---

## POST /api/host/extendRound

Extend or modify the deadline of the current round.

### Headers
```http
X-Game-Id: game_abc123xyz
X-Host-Key: host_9f8e7d6c5b4a
```

### Request Body (Option 1: Absolute Time)
```json
{
  "roundId": "game_abc123xyz_round1",
  "newEndTime": 1704160000000
}
```

### Request Body (Option 2: Relative Extension)
```json
{
  "roundId": "game_abc123xyz_round1",
  "extendByMs": 7200000
}
```

### Request Body Parameters
- `roundId` (required): Round to modify
- `newEndTime` (optional): New absolute end timestamp
- `extendByMs` (optional): Milliseconds to add to current end time
- Provide either `newEndTime` OR `extendByMs`, not both

### Response 200
```json
{
  "success": true,
  "data": {
    "roundId": "game_abc123xyz_round1",
    "oldEndTime": 1704153600000,
    "newEndTime": 1704160000000,
    "extensionMs": 7200000,
    "message": "Round deadline extended by 2 hours"
  }
}
```

### Response 400 (Round Already Ended)
```json
{
  "success": false,
  "error": "Cannot extend a completed round",
  "code": "ROUND_ALREADY_ENDED"
}
```

---

## POST /api/host/endRound

Manually end the current round. If solutions exist, marks as completed and updates board. If no solutions, can mark as skipped.

### Headers
```http
X-Game-Id: game_abc123xyz
X-Host-Key: host_9f8e7d6c5b4a
```

### Request Body
```json
{
  "roundId": "game_abc123xyz_round1",
  "skipGoal": false
}
```

### Request Body Parameters
- `roundId` (required): Round to end
- `skipGoal` (optional, default: false): If true, marks round as "skipped" and goal remains available for future rounds

### Response 200 (Completed)
```json
{
  "success": true,
  "data": {
    "roundId": "game_abc123xyz_round1",
    "endTime": 1704100000000,
    "status": "completed",
    "solutionCount": 12,
    "winningMoveCount": 7,
    "goalsCompleted": 8,
    "goalsRemaining": 9,
    "message": "Round ended successfully. Start a new round when ready."
  }
}
```

### Response 200 (Skipped)
```json
{
  "success": true,
  "data": {
    "roundId": "game_abc123xyz_round1",
    "endTime": 1704100000000,
    "status": "skipped",
    "solutionCount": 0,
    "goalsCompleted": 7,
    "goalsRemaining": 10,
    "message": "Round skipped. This goal will be available again in future rounds."
  }
}
```

### Response 400 (Round Already Ended)
```json
{
  "success": false,
  "error": "Round is already completed",
  "code": "ROUND_ALREADY_ENDED"
}
```

### Skip Behavior
- When `skipGoal: true`: Round status becomes "skipped"
- Goal NOT added to `completedGoalIndices`
- Robot positions remain unchanged
- Goal returns to available pool for future rounds
- Useful when a goal is too easy or has no submissions

---

## GET /api/host/dashboard

Get comprehensive dashboard data for the game.

### Headers
```http
X-Game-Id: game_abc123xyz
X-Host-Key: host_9f8e7d6c5b4a
```

### Query Parameters
None

### Response 200
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "gameName": "Friday Night Puzzle",
    "createdAt": 1704000000000,
    "defaultRoundDurationMs": 86400000,
    "totalRounds": 8,
    "goalsCompleted": 7,
    "goalsRemaining": 10,
    "gameComplete": false,
    "currentRound": {
      "roundId": "game_abc123xyz_round8",
      "roundNumber": 8,
      "goalIndex": 12,
      "goalColor": "green",
      "startTime": 1704067200000,
      "endTime": 1704153600000,
      "status": "active",
      "solutionCount": 12,
      "topSolution": {
        "playerName": "Alice",
        "moveCount": 7,
        "winningRobot": "green",
        "submittedAt": 1704070000000
      },
      "timeRemaining": 53600000
    },
    "previousRounds": [
      {
        "roundId": "game_abc123xyz_round7",
        "roundNumber": 7,
        "goalIndex": 8,
        "goalColor": "red",
        "startTime": 1703980800000,
        "endTime": 1704067200000,
        "status": "completed",
        "solutionCount": 15,
        "winner": {
          "playerName": "Bob",
          "moveCount": 8,
          "winningRobot": "red",
          "submittedAt": 1703985000000
        }
      },
      {
        "roundId": "game_abc123xyz_round6",
        "roundNumber": 6,
        "goalIndex": 5,
        "goalColor": "multi",
        "startTime": 1703894400000,
        "endTime": 1703980800000,
        "status": "skipped",
        "solutionCount": 0,
        "skippedReason": "No submissions"
      },
      {
        "roundId": "game_abc123xyz_round5",
        "roundNumber": 5,
        "goalIndex": 14,
        "goalColor": "blue",
        "startTime": 1703808000000,
        "endTime": 1703894400000,
        "status": "completed",
        "solutionCount": 13,
        "winner": {
          "playerName": "Alice",
          "moveCount": 9,
          "winningRobot": "blue",
          "submittedAt": 1703813000000
        }
      }
    ],
    "statistics": {
      "totalPlayers": 28,
      "totalSolutions": 67,
      "averageSolutionsPerRound": 11.2,
      "completedRounds": 6,
      "skippedRounds": 1,
      "bestEverSolution": {
        "playerName": "Alice",
        "moveCount": 7,
        "winningRobot": "green",
        "roundNumber": 8
      }
    }
  }
}
```

### Response 200 (No Active Round)
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "gameName": "Friday Night Puzzle",
    "createdAt": 1704000000000,
    "defaultRoundDurationMs": 86400000,
    "totalRounds": 7,
    "goalsCompleted": 7,
    "goalsRemaining": 10,
    "gameComplete": false,
    "currentRound": null,
    "hasActiveRound": false,
    "message": "No active round",
    "previousRounds": [ /* ... */ ],
    "statistics": { /* ... */ }
  }
}
```

### Response 200 (Game Complete)
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "gameName": "Friday Night Puzzle",
    "createdAt": 1704000000000,
    "totalRounds": 17,
    "goalsCompleted": 17,
    "goalsRemaining": 0,
    "gameComplete": true,
    "currentRound": null,
    "message": "Game complete! All 17 goals have been solved.",
    "previousRounds": [ /* all 17 rounds */ ],
    "statistics": {
      "totalPlayers": 45,
      "totalSolutions": 289,
      "averageSolutionsPerRound": 17.0,
      "completedRounds": 17,
      "skippedRounds": 0,
      "bestEverSolution": {
        "playerName": "Alice",
        "moveCount": 6,
        "winningRobot": "red",
        "roundNumber": 14
      }
    }
  }
}
```

---

# Timer Function (Internal)

## checkRoundEnd

**Trigger:** Time-based (runs every 1 minute)  
**Type:** Internal function (not exposed as HTTP endpoint)

### Function Behavior
1. Queries all active rounds
2. Checks if current time > endTime
3. For expired rounds:
   - Updates status to "completed"
   - If solutions exist: Updates board with winning solution's final robot positions
   - Adds goalIndex to completedGoalIndices
   - Logs round end event
4. Does NOT automatically create new rounds (host controlled)

### Logging
```javascript
{
  "timestamp": 1704153600000,
  "event": "round_ended",
  "gameId": "game_abc123xyz",
  "roundId": "game_abc123xyz_round5",
  "goalIndex": 5,
  "solutionCount": 12,
  "winningMoveCount": 7,
  "endReason": "timer"
}
```

---

# Rate Limiting

Azure Functions applies default rate limiting:
- **Per Function:** ~100 requests/second
- **Per Subscription:** Varies by plan

Custom rate limiting can be added per player:
- Submit solution: Unlimited per round (players can resubmit to improve)
- Get leaderboard: Recommended client-side throttling (20s polling)

---

# CORS Configuration

Allowed origins:
- `https://ricochet-robots.azurewebsites.net` (production)
- `http://localhost:*` (development)

Allowed methods:
- GET, POST, PUT, OPTIONS

Allowed headers:
- Content-Type, X-Game-Id, X-Host-Key

---

# Changelog

## v1.2.0 (Solution Replay)
- **Between-rounds replay**: `getCurrentRound` now returns full completed round data when `hasActiveRound === false`
- **Robot starting positions**: Round data includes starting positions (before solutions applied) to enable replay
- **Seamless transitions**: Players can view and replay solutions immediately after round ends
- **Persistent display**: Last completed round remains visible until host starts new round
- **Enhanced player experience**: No downtime between rounds - board and leaderboard stay visible

## v1.1.0 (Multiple Submissions)
- **Multiple submissions per player**: Players can submit unlimited solutions per round
- **Submission numbering**: Each submission gets a sequential number (1st, 2nd, 3rd attempt)
- **Enhanced leaderboard**: Shows all submissions with attempt numbers
- **Removed duplicate check**: No more `DUPLICATE_SUBMISSION` error
- **Improved competition**: Same player can occupy multiple leaderboard positions

## v1.0.0 (Initial Release)
- Player endpoints for gameplay
- Host endpoints for game management
- Multi-game support
- Solution validation
- Automatic round expiration
- Board persistence across rounds
- Multi-color goal support
- Goal skip functionality
- 17-goal game lifecycle
