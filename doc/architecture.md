# Async Ricochet Robots - System Architecture

## Overview

Async Ricochet Robots is a multiplayer online implementation of the classic Ricochet Robots board game, designed for asynchronous play across extended time periods (configurable, default 24 hours). The system uses a serverless architecture on Azure to minimize operational overhead while supporting multiple independent games.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Players & Hosts                     │
│                  (Web Browsers)                      │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
               │ HTTPS                │ HTTPS
               │ (Polling every 20s)  │ (Admin actions)
               │                      │
┌──────────────▼──────────────────────▼────────────────┐
│          Azure Static Web Apps                       │
│  ┌─────────────────┐  ┌──────────────────┐          │
│  │  Player UI      │  │  Host Panel      │          │
│  │  (index.html)   │  │  (host.html)     │          │
│  └─────────────────┘  └──────────────────┘          │
└──────────────┬──────────────────────────────────────┘
               │
               │ HTTPS (API Calls)
               │
┌──────────────▼──────────────────────────────────────┐
│          Azure Functions (Node.js)                   │
│                                                      │
│  Player Endpoints:                                   │
│  ├─ GET  /api/getCurrentRound                       │
│  ├─ GET  /api/getLeaderboard                        │
│  └─ POST /api/submitSolution                        │
│                                                      │
│  Game Management:                                    │
│  └─ POST /api/createGame                            │
│                                                      │
│  Host Endpoints:                                     │
│  ├─ POST /api/host/startRound                       │
│  ├─ PUT  /api/host/extendRound                      │
│  ├─ POST /api/host/endRound                         │
│  └─ GET  /api/host/dashboard                        │
│                                                      │
│  Timer Function:                                     │
│  └─ checkRoundEnd (runs every 1 minute)             │
│                                                      │
└──────────────┬──────────────────────────────────────┘
               │
               │ Azure Storage SDK
               │
┌──────────────▼──────────────────────────────────────┐
│          Azure Table Storage                         │
│                                                      │
│  Tables:                                             │
│  ├─ Games      (game metadata & host keys)          │
│  ├─ Rounds     (puzzle data, timing)                │
│  └─ Solutions  (player submissions)                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Key Components

### 1. Frontend (Azure Static Web Apps)

**Player UI (`client/index.html`)**
- HTML5 Canvas-based game board rendering
- Interactive robot movement (local practice)
- Solution submission interface
- Real-time leaderboard (polling-based)
- Responsive design for desktop and tablet

**Host Panel (`client/host.html`)**
- Game management dashboard
- Round creation and control
- Deadline extension controls
- Player statistics and history
- Shareable game links

**Technology Stack:**
- Pure HTML5, CSS3, JavaScript (ES6+)
- HTML5 Canvas for game rendering
- localStorage for client-side state persistence
- Fetch API for HTTP requests

### 2. Backend (Azure Functions)

**Runtime:** Node.js 18+

**Functions:**

1. **Player Functions** (HTTP triggered)
   - `getCurrentRound`: Fetches active round for a game
   - `getLeaderboard`: Returns ranked solutions
   - `submitSolution`: Validates and stores player solutions

2. **Game Management** (HTTP triggered)
   - `createGame`: Initializes new game instance with host key

3. **Host Functions** (HTTP triggered, requires authentication)
   - `startRound`: Creates new round with generated puzzle
   - `extendRound`: Modifies round deadline
   - `endRound`: Manually completes round
   - `getDashboard`: Returns host analytics

4. **Timer Function** (Time triggered)
   - `checkRoundEnd`: Runs every minute, ends expired rounds

**Shared Modules:**
- `game-engine.js`: Core Ricochet Robots logic
- `puzzle-generator.js`: Random board generation
- `storage.js`: Azure Table Storage abstraction
- `auth.js`: Host key validation middleware

### 3. Data Layer (Azure Table Storage)

**Why Table Storage?**
- NoSQL key-value store, perfect for our data model
- Extremely cost-effective ($0.05/GB/month)
- Fast lookups by partition key
- No schema migrations required
- Supports 500 entities per second (more than sufficient)

**Tables:**
- `Games`: One partition for all games
- `Rounds`: Partitioned by gameId
- `Solutions`: Partitioned by gameId_roundId

See [data-models.md](./data-models.md) for detailed schemas.

### 4. Game Engine

**Core Responsibilities:**
- Robot movement simulation (slide until collision)
- Solution validation (replay moves, verify goal reached)
- Board state management

**Shared Between Client & Server:**
The game engine is isomorphic JavaScript, allowing:
- Client-side local gameplay without server calls
- Server-side solution verification
- Consistent behavior across environments

## Communication Patterns

### Polling Architecture

Instead of WebSockets, the system uses HTTP polling:

**Polling Interval:** 20 seconds

**What Gets Polled:**
1. Current round status (detect new rounds)
2. Leaderboard updates (new submissions)

**Benefits:**
- Simpler than WebSocket management
- Works reliably through firewalls/proxies
- No persistent connection overhead
- Perfectly acceptable for async gameplay

**Client Polling Logic:**
```javascript
setInterval(async () => {
  const round = await fetchCurrentRound();
  if (round.roundId !== currentRoundId) {
    loadNewRound(round);
  }
  
  const leaderboard = await fetchLeaderboard();
  updateLeaderboardUI(leaderboard);
}, 20000);
```

### Authentication

**Host Authentication:**
- Each game has a unique `hostKey` (UUID)
- Hosts send key in `X-Host-Key` header
- Server validates before allowing admin actions
- No user accounts required

**Player Authentication:**
- No authentication required
- Players identified by username only
- One solution per username per round (enforced by unique constraint)

## Multi-Game Isolation

**Game Instances:**
- Each game is completely independent
- Host creates game, receives unique gameId and hostKey
- Players access via URL parameter: `?game=gameId`
- Multiple games can run simultaneously

**Data Isolation:**
- Rounds partitioned by gameId
- Solutions partitioned by gameId_roundId
- Queries scoped to specific game

**Benefits:**
- Friends can run private games
- No interference between games
- Scalable to hundreds of concurrent games

## Scalability Considerations

**Expected Load:**
- ~100 concurrent players per game (max)
- ~10-50 concurrent games
- 1 API request per player every 20 seconds (polling)
- 1 solution submission per player per round

**Azure Functions Scaling:**
- Consumption plan auto-scales
- Each request is stateless
- Cold start: ~1-2 seconds (acceptable for polling)

**Database Performance:**
- Table Storage: 500 operations/second per partition
- Our partition strategy keeps each game isolated
- Well within performance limits

**Cost Estimate (monthly):**
- Azure Functions: Free tier (1M executions)
- Table Storage: $0.10 (few MB of data)
- Static Web Apps: Free tier
- **Total: ~$0-1/month for hobby use**

## Deployment Architecture

**Development:**
```
Local Machine
├─ Azure Functions Core Tools (local function host)
├─ Azurite (local storage emulator)
└─ Live Server (static files)
```

**Production:**
```
Azure Subscription
├─ Resource Group: ricochet-robots-rg
│   ├─ Static Web App: ricochet-robots-app
│   ├─ Function App: ricochet-robots-api
│   └─ Storage Account: ricochetrobotsdata
└─ GitHub Actions (CI/CD)
```

**Deployment Flow:**
1. Push to GitHub main branch
2. GitHub Actions triggers
3. Builds Azure Functions
4. Deploys to Azure (Static Web Apps + Functions)
5. Zero downtime deployment

## Security Considerations

**Host Key Protection:**
- Transmitted via HTTPS only
- Stored in Azure Table Storage (encrypted at rest)
- Not exposed in player-facing URLs
- Regeneration not supported (keep it safe!)

**Input Validation:**
- All API inputs validated server-side
- Solution data sanitized before storage
- Player names limited to 20 characters, alphanumeric + spaces
- Game/round IDs validated against database

**Rate Limiting:**
- Azure Functions has built-in throttling
- Could add per-player rate limiting if abuse occurs
- Table Storage has automatic retry policies

**CORS:**
- Configured to allow requests from Static Web App domain
- Prevents unauthorized API access from other domains

## Monitoring & Logging

**Application Insights:**
- Automatic integration with Azure Functions
- Tracks request duration, failures, dependencies
- Custom events for game milestones (round start/end)

**Metrics to Track:**
- API response times
- Solution validation failures
- Round creation frequency
- Active games count

**Logging Strategy:**
- Info: Round creation, solution submissions
- Warning: Invalid solutions, expired host keys
- Error: Database failures, validation errors

## Future Enhancements

**Potential Features:**
1. Game templates (pre-configured puzzles)
2. Tournament mode (multi-game competitions)
3. Analytics dashboard for hosts
4. Solution playback visualization
5. Mobile app (React Native)
6. AI opponent/hint system

**Technical Improvements:**
1. Redis cache for hot data (active rounds)
2. CDN for static assets
3. Database backup/restore functionality
4. Audit logs for host actions
5. Multi-region deployment
