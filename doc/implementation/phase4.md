# Phase 4 Implementation Plan: Frontend UI

## Overview

**Phase:** Frontend UI (Static Web App)  
**Goal:** Build interactive player UI and host panel with Canvas rendering  
**Estimated Time:** 12-16 hours  
**Confidence Level:** 8/10  
**Prerequisites:** Phase 3 complete (API endpoints working)

This phase implements the browser-based frontend with HTML5 Canvas rendering, interactive gameplay, and polling-based updates.

---

## Architecture Decisions

### Technology Stack

**Language:** TypeScript (ES2020 target)
- Full type safety throughout frontend code
- Same language consistency as backend (Phases 2-3)
- Better IDE support and refactoring capabilities
- Catches errors at compile time vs runtime

**Module System:** ES6 Modules (`type="module"`)
- Native browser support (no bundler needed)
- Clean import/export syntax
- Enables code splitting naturally

**Build Tool:** TypeScript Compiler (`tsc --watch`)
- Simple, no webpack/vite complexity
- Auto-compile on save during development
- Production-ready JavaScript output

**Development Server:** Live Server (by Ritwick Dey)
- VS Code extension: `ritwickdey.LiveServer`
- Auto-reload on file changes
- Proper CORS handling for local API calls
- Simple one-click launch

### Project Structure

```
client/
├── src/                    # TypeScript source files
│   ├── api-client.ts
│   ├── game-renderer.ts
│   ├── game-controller.ts
│   ├── player-app.ts
│   └── host-panel.ts
├── dist/                   # Compiled JavaScript (git-ignored)
│   ├── api-client.js
│   ├── game-renderer.js
│   └── ...
├── css/                    # Stylesheets
│   ├── shared.css
│   ├── game.css
│   └── host.css
├── index.html              # Player UI (references dist/)
├── host.html               # Host panel (references dist/)
├── package.json            # TypeScript dependency
├── tsconfig.json           # TypeScript configuration
└── staticwebapp.config.json # Azure deployment config
```

### Import Strategy

**Shared Game Engine:** Direct imports from compiled output
```typescript
// In client/src/game-controller.ts
import { moveRobot, applyMoves } from '../../dist/shared/game-engine.js';
import type { Robots, Walls, Move } from '../../dist/shared/types.js';
```

**Why this works:**
- Shared code already compiled to `dist/shared/` from Phase 2
- Browser can import ES6 modules from relative paths
- No code duplication needed (unlike Azure Functions)
- Type definitions available via TypeScript

### Development Workflow

**Three-terminal setup:**
```bash
# Terminal 1: Backend API
cd api
npm start                    # Azure Functions on :7071

# Terminal 2: Frontend build (auto-compile)
cd client
npm run build               # tsc --watch

# Terminal 3: VS Code Live Server
# Click "Go Live" in status bar → Opens :5500
```

**Why this approach:**
- Minimal complexity (just one build step)
- Fast feedback (auto-compile on save)
- No bundler needed (native ES modules)
- Easy to upgrade later if needed

### CORS Configuration

**Azure Functions local development:**
```json
// api/host.json
{
  "version": "2.0",
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  },
  "cors": {
    "allowedOrigins": ["http://localhost:5500"],
    "supportCredentials": false
  }
}
```

**Production:** Azure Static Web Apps automatically handles CORS for `/api` routes

### TypeScript Configuration

**File:** `client/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### HTML Module Loading

**Scripts loaded as ES6 modules:**
```html
<!-- index.html -->
<script type="module" src="dist/player-app.js"></script>

<!-- host.html -->
<script type="module" src="dist/host-panel.js"></script>
```

**Benefits:**
- Automatic strict mode
- Deferred execution (DOMContentLoaded not needed)
- Import/export support
- No global namespace pollution

### Key Design Decisions Summary

1. **TypeScript over JavaScript** - Type safety worth minimal build complexity
2. **No bundler** - Keep it simple, native ES modules work great
3. **Direct imports** - Reuse compiled shared code, no duplication
4. **Live Server** - Best developer experience for static files
5. **Modern ES6+** - All target browsers support it fully

### Browser Support Targets

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 14+, Chrome Android latest

All support ES2020 and ES6 modules natively.

---

## Task Breakdown

### Task 1: Project Structure & Static Assets
**Estimated Time:** 30 minutes  
**Priority:** High (Blocking)

#### What to Build
- Set up client folder structure
- Create HTML templates
- Set up CSS framework/styling
- Configure static file serving

#### Folder Structure
```
async-ricochet-robots/
├── client/                    # Frontend files
│   ├── index.html            # Player UI
│   ├── host.html             # Host panel
│   ├── css/
│   │   ├── game.css          # Game board styles
│   │   ├── host.css          # Host panel styles
│   │   └── shared.css        # Shared styles
│   ├── js/
│   │   ├── game-renderer.js  # Canvas rendering
│   │   ├── game-controller.js # Player interaction
│   │   ├── api-client.js     # API communication
│   │   ├── host-panel.js     # Host controls
│   │   └── utils.js          # Shared utilities
│   ├── assets/
│   │   └── favicon.ico
│   └── staticwebapp.config.json  # Azure config
├── shared/                    # ✅ From Phase 2
├── api/                       # ✅ From Phase 3
└── doc/                       # ✅ Complete
```

#### Files to Create

1. **`client/staticwebapp.config.json`**:
   ```json
   {
     "routes": [
       {
         "route": "/api/*",
         "allowedRoles": ["anonymous"]
       }
     ],
     "navigationFallback": {
       "rewrite": "/index.html"
     },
     "mimeTypes": {
       ".json": "application/json"
     }
   }
   ```

2. **Basic HTML structure** for both pages
3. **CSS reset and base styles**

#### Success Criteria
- ✅ Folder structure created
- ✅ HTML templates ready
- ✅ CSS files linked
- ✅ Can serve locally (Live Server or similar)

---

### Task 2: API Client Module
**Estimated Time:** 1 hour  
**Priority:** High (Blocking)  
**Dependencies:** Task 1, Phase 3

#### What to Build
**File:** `client/js/api-client.js`

Create API wrapper for all backend endpoints.

#### Class to Implement

```javascript
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'http://localhost:7071/api';
  }

  // Player endpoints
  async getCurrentRound(gameId) {
    const response = await fetch(`${this.baseUrl}/getCurrentRound?gameId=${gameId}`);
    return await response.json();
  }

  async getLeaderboard(gameId, roundId) {
    const response = await fetch(
      `${this.baseUrl}/getLeaderboard?gameId=${gameId}&roundId=${roundId}`
    );
    return await response.json();
  }

  async submitSolution(gameId, roundId, playerName, solutionData) {
    const response = await fetch(`${this.baseUrl}/submitSolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, roundId, playerName, solutionData })
    });
    return await response.json();
  }

  // Game management
  async createGame(gameName, defaultRoundDurationMs) {
    const response = await fetch(`${this.baseUrl}/createGame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameName, defaultRoundDurationMs })
    });
    return await response.json();
  }

  // Host endpoints
  async startRound(gameId, hostKey, durationMs) {
    const response = await fetch(`${this.baseUrl}/host/startRound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      },
      body: JSON.stringify({ durationMs })
    });
    return await response.json();
  }

  async extendRound(gameId, hostKey, roundId, extendByMs) {
    const response = await fetch(`${this.baseUrl}/host/extendRound`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      },
      body: JSON.stringify({ roundId, extendByMs })
    });
    return await response.json();
  }

  async endRound(gameId, hostKey, roundId, skipGoal = false) {
    const response = await fetch(`${this.baseUrl}/host/endRound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      },
      body: JSON.stringify({ roundId, skipGoal })
    });
    return await response.json();
  }

  async getDashboard(gameId, hostKey) {
    const response = await fetch(`${this.baseUrl}/host/dashboard`, {
      method: 'GET',
      headers: {
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      }
    });
    return await response.json();
  }
}
```

#### Error Handling

```javascript
async fetchWithErrorHandling(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

#### Success Criteria
- ✅ All API methods implemented
- ✅ Error handling works
- ✅ Can call backend endpoints
- ✅ Proper request/response format

---

### Task 3: Canvas Game Renderer
**Estimated Time:** 3 hours  
**Priority:** High (Blocking)  
**Dependencies:** Task 1, Phase 2 (game engine)

#### What to Build
**File:** `client/js/game-renderer.js`

Render the 16×16 game board with robots, walls, and goals using HTML5 Canvas.

#### Class to Implement

```javascript
class GameRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.cellSize = 40; // pixels per cell
    this.canvas.width = 16 * this.cellSize;
    this.canvas.height = 16 * this.cellSize;
    
    this.colors = {
      red: '#E74C3C',
      yellow: '#F39C12',
      green: '#27AE60',
      blue: '#3498DB',
      multi: '#9B59B6'
    };
  }

  render(puzzle, activeGoalIndex) {
    this.clear();
    this.drawGrid();
    this.drawWalls(puzzle.walls);
    this.drawAllGoals(puzzle.allGoals, activeGoalIndex);
    this.drawRobots(puzzle.robots);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid() {
    // Draw 16×16 grid lines
    this.ctx.strokeStyle = '#ECF0F1';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i <= 16; i++) {
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, this.canvas.height);
      this.ctx.stroke();
      
      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(this.canvas.width, i * this.cellSize);
      this.ctx.stroke();
    }
  }

  drawWalls(walls) {
    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 4;
    
    // Horizontal walls (below row)
    for (let row = 0; row < 16; row++) {
      if (walls.horizontal[row]) {
        for (const col of walls.horizontal[row]) {
          const x = col * this.cellSize;
          const y = (row + 1) * this.cellSize;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x + this.cellSize, y);
          this.ctx.stroke();
        }
      }
    }
    
    // Vertical walls (right of column)
    for (let col = 0; col < 16; col++) {
      if (walls.vertical[col]) {
        for (const row of walls.vertical[col]) {
          const x = (col + 1) * this.cellSize;
          const y = row * this.cellSize;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x, y + this.cellSize);
          this.ctx.stroke();
        }
      }
    }
  }

  drawAllGoals(allGoals, activeGoalIndex) {
    allGoals.forEach((goal, index) => {
      const isActive = index === activeGoalIndex;
      this.drawGoal(goal.position, goal.color, isActive);
    });
  }

  drawGoal(position, color, isActive) {
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const radius = isActive ? 12 : 6;
    
    this.ctx.fillStyle = this.colors[color];
    this.ctx.globalAlpha = isActive ? 1.0 : 0.3;
    
    // Draw goal marker (star or circle)
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    if (isActive) {
      // Draw outline for active goal
      this.ctx.strokeStyle = '#2C3E50';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1.0;
  }

  drawRobots(robots) {
    const robotSize = this.cellSize * 0.6;
    
    Object.entries(robots).forEach(([color, position]) => {
      const x = position.x * this.cellSize + this.cellSize / 2;
      const y = position.y * this.cellSize + this.cellSize / 2;
      
      // Draw robot circle
      this.ctx.fillStyle = this.colors[color];
      this.ctx.beginPath();
      this.ctx.arc(x, y, robotSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw outline
      this.ctx.strokeStyle = '#2C3E50';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw label
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(color[0].toUpperCase(), x, y);
    });
  }

  animateMove(robotColor, fromPos, toPos, duration = 300) {
    // Smooth animation for robot movement
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentX = fromPos.x + (toPos.x - fromPos.x) * eased;
        const currentY = fromPos.y + (toPos.y - fromPos.y) * eased;
        
        // Re-render with updated position
        // (This requires access to full game state)
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }
}
```

#### Success Criteria
- ✅ 16×16 grid renders correctly
- ✅ Walls displayed in correct positions
- ✅ All 17 goals visible (active highlighted)
- ✅ Robots render with colors and labels
- ✅ Smooth animations (60fps)
- ✅ Responsive canvas sizing

---

### Task 4: Game Controller (Player Interaction)
**Estimated Time:** 2 hours  
**Priority:** High  
**Dependencies:** Tasks 2, 3, Phase 2 (game engine)

#### What to Build
**File:** `client/js/game-controller.js`

Handle player input, local puzzle solving, and solution building.

#### Class to Implement

```javascript
// Import game engine from Phase 2
import { moveRobot, validateSolution } from '../../shared/game-engine.js';

class GameController {
  constructor(renderer, apiClient) {
    this.renderer = renderer;
    this.apiClient = apiClient;
    
    this.puzzle = null;
    this.currentState = null; // Current robot positions (mutable for local play)
    this.moveHistory = [];    // Solution being built
    this.selectedRobot = null;
    
    this.setupKeyboardControls();
    this.setupMouseControls();
  }

  loadPuzzle(puzzle, goalIndex) {
    this.puzzle = puzzle;
    this.currentState = JSON.parse(JSON.stringify(puzzle.robots)); // Deep clone
    this.moveHistory = [];
    this.goalIndex = goalIndex;
    this.render();
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      // Robot selection: R, Y, G, B keys
      const robotKeys = {
        'r': 'red',
        'y': 'yellow',
        'g': 'green',
        'b': 'blue'
      };
      
      if (robotKeys[e.key.toLowerCase()]) {
        this.selectRobot(robotKeys[e.key.toLowerCase()]);
        return;
      }
      
      // Movement: Arrow keys
      if (!this.selectedRobot) return;
      
      const directions = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      };
      
      if (directions[e.key]) {
        e.preventDefault();
        this.move(this.selectedRobot, directions[e.key]);
      }
      
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
    });
  }

  setupMouseControls() {
    this.renderer.canvas.addEventListener('click', (e) => {
      const rect = this.renderer.canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / this.renderer.cellSize);
      const y = Math.floor((e.clientY - rect.top) / this.renderer.cellSize);
      
      // Check if clicked on a robot
      for (const [color, pos] of Object.entries(this.currentState)) {
        if (pos.x === x && pos.y === y) {
          this.selectRobot(color);
          return;
        }
      }
    });
  }

  selectRobot(color) {
    this.selectedRobot = color;
    this.updateUI();
  }

  move(robotColor, direction) {
    const before = JSON.parse(JSON.stringify(this.currentState));
    
    // Use game engine to calculate move
    this.currentState = moveRobot(
      this.puzzle.walls,
      this.currentState,
      robotColor,
      direction
    );
    
    // Check if robot actually moved
    const after = this.currentState[robotColor];
    const moved = (before[robotColor].x !== after.x || before[robotColor].y !== after.y);
    
    if (moved) {
      // Add to move history
      this.moveHistory.push({ robot: robotColor, direction });
      
      // Animate the move
      this.renderer.animateMove(robotColor, before[robotColor], after).then(() => {
        this.render();
        this.checkGoalReached();
      });
    }
  }

  undo() {
    if (this.moveHistory.length === 0) return;
    
    // Replay all moves except last one
    this.moveHistory.pop();
    this.currentState = JSON.parse(JSON.stringify(this.puzzle.robots));
    
    for (const move of this.moveHistory) {
      this.currentState = moveRobot(
        this.puzzle.walls,
        this.currentState,
        move.robot,
        move.direction
      );
    }
    
    this.render();
    this.checkGoalReached();
  }

  reset() {
    this.currentState = JSON.parse(JSON.stringify(this.puzzle.robots));
    this.moveHistory = [];
    this.render();
    this.updateUI();
  }

  checkGoalReached() {
    const goal = this.puzzle.allGoals[this.goalIndex];
    const validation = validateSolution(
      {
        walls: this.puzzle.walls,
        robots: this.puzzle.robots,
        goalPosition: goal.position,
        goalColor: goal.color
      },
      this.moveHistory
    );
    
    if (validation.valid) {
      this.showGoalReached(validation);
    }
    
    this.updateUI();
  }

  showGoalReached(validation) {
    const message = `Goal reached! ${validation.moveCount} moves using ${validation.winningRobot} robot.`;
    // Show success indicator in UI
    document.getElementById('goal-status').textContent = message;
    document.getElementById('goal-status').className = 'success';
    document.getElementById('submit-btn').disabled = false;
  }

  async submitSolution(playerName) {
    const goal = this.puzzle.allGoals[this.goalIndex];
    
    try {
      const result = await this.apiClient.submitSolution(
        this.gameId,
        this.roundId,
        playerName,
        this.moveHistory
      );
      
      if (result.success) {
        this.showSubmitSuccess(result.data);
      }
    } catch (error) {
      this.showSubmitError(error.message);
    }
  }

  render() {
    this.renderer.render(
      {
        walls: this.puzzle.walls,
        robots: this.currentState,
        allGoals: this.puzzle.allGoals
      },
      this.goalIndex
    );
  }

  updateUI() {
    // Update move counter
    document.getElementById('move-count').textContent = this.moveHistory.length;
    
    // Update selected robot indicator
    const indicators = document.querySelectorAll('.robot-selector');
    indicators.forEach(indicator => {
      indicator.classList.toggle('selected', 
        indicator.dataset.robot === this.selectedRobot);
    });
    
    // Update move history list
    this.updateMoveHistory();
  }

  updateMoveHistory() {
    const list = document.getElementById('move-history');
    list.innerHTML = '';
    
    this.moveHistory.forEach((move, index) => {
      const item = document.createElement('li');
      item.textContent = `${index + 1}. ${move.robot} → ${move.direction}`;
      list.appendChild(item);
    });
  }
}
```

#### Success Criteria
- ✅ Keyboard controls work (arrows + R/Y/G/B)
- ✅ Mouse controls work (click to select robot)
- ✅ Robots move correctly (using game engine)
- ✅ Move history tracks all moves
- ✅ Undo/reset functionality works
- ✅ Goal detection accurate
- ✅ Submit button enabled when goal reached

---

### Task 5: Player UI - HTML Structure
**Estimated Time:** 1.5 hours  
**Priority:** High  
**Dependencies:** Tasks 1, 2, 3, 4

#### What to Build
**File:** `client/index.html`

Complete player interface with game board, controls, and leaderboard.

#### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Async Ricochet Robots</title>
  <link rel="stylesheet" href="css/shared.css">
  <link rel="stylesheet" href="css/game.css">
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header>
      <h1>Async Ricochet Robots</h1>
      <div id="game-info">
        <span id="game-name"></span>
        <span id="round-number"></span>
        <span id="time-remaining"></span>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left: Game Board -->
      <div class="game-section">
        <div class="goal-info">
          <h2>Goal: <span id="goal-description"></span></h2>
          <div id="goal-status"></div>
        </div>
        
        <canvas id="game-board"></canvas>
        
        <div class="controls">
          <div class="robot-selectors">
            <button class="robot-selector" data-robot="red">Red (R)</button>
            <button class="robot-selector" data-robot="yellow">Yellow (Y)</button>
            <button class="robot-selector" data-robot="green">Green (G)</button>
            <button class="robot-selector" data-robot="blue">Blue (B)</button>
          </div>
          
          <div class="move-controls">
            <button id="undo-btn">↶ Undo (Ctrl+Z)</button>
            <button id="reset-btn">⟲ Reset</button>
          </div>
        </div>
        
        <div class="solution-info">
          <h3>Your Solution</h3>
          <div class="move-count">Moves: <span id="move-count">0</span></div>
          <ul id="move-history"></ul>
          
          <div class="submit-section">
            <input type="text" id="player-name" placeholder="Your name" maxlength="20">
            <button id="submit-btn" disabled>Submit Solution</button>
          </div>
        </div>
      </div>

      <!-- Right: Leaderboard -->
      <aside class="leaderboard-section">
        <h2>Leaderboard</h2>
        <div id="leaderboard-container">
          <table id="leaderboard">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Moves</th>
                <th>Robot</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body">
              <!-- Populated by JavaScript -->
            </tbody>
          </table>
        </div>
      </aside>
    </div>

    <!-- No Active Round State -->
    <div id="no-round-message" style="display: none;">
      <h2>No Active Round</h2>
      <p>Waiting for host to start the next round...</p>
      <div id="game-stats"></div>
    </div>

    <!-- Game Complete State -->
    <div id="game-complete-message" style="display: none;">
      <h2>🎉 Game Complete!</h2>
      <p>All 17 goals have been completed!</p>
    </div>
  </div>

  <script type="module" src="js/api-client.js"></script>
  <script type="module" src="js/game-renderer.js"></script>
  <script type="module" src="js/game-controller.js"></script>
  <script type="module" src="js/player-app.js"></script>
</body>
</html>
```

#### Success Criteria
- ✅ Complete HTML structure
- ✅ Semantic markup
- ✅ Accessibility features
- ✅ Mobile-responsive layout
- ✅ All UI elements present

---

### Task 6: Player UI - Main Application Logic
**Estimated Time:** 2 hours  
**Priority:** High  
**Dependencies:** Tasks 2, 3, 4, 5

#### What to Build
**File:** `client/js/player-app.js`

Main application controller with polling and state management.

#### Implementation

```javascript
import { ApiClient } from './api-client.js';
import { GameRenderer } from './game-renderer.js';
import { GameController } from './game-controller.js';

class PlayerApp {
  constructor() {
    // Get gameId from URL parameter
    const params = new URLSearchParams(window.location.search);
    this.gameId = params.get('game');
    
    if (!this.gameId) {
      this.showError('No game ID provided. Check your link.');
      return;
    }
    
    this.apiClient = new ApiClient();
    this.renderer = new GameRenderer('game-board');
    this.controller = new GameController(this.renderer, this.apiClient);
    
    this.currentRound = null;
    this.pollingInterval = null;
    
    this.init();
  }

  async init() {
    // Load player name from localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      document.getElementById('player-name').value = savedName;
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial load
    await this.loadCurrentRound();
    
    // Start polling (every 20 seconds)
    this.startPolling();
  }

  setupEventListeners() {
    // Robot selectors
    document.querySelectorAll('.robot-selector').forEach(btn => {
      btn.addEventListener('click', () => {
        this.controller.selectRobot(btn.dataset.robot);
      });
    });
    
    // Control buttons
    document.getElementById('undo-btn').addEventListener('click', () => {
      this.controller.undo();
    });
    
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.controller.reset();
    });
    
    // Submit button
    document.getElementById('submit-btn').addEventListener('click', () => {
      this.submitSolution();
    });
    
    // Save player name to localStorage
    document.getElementById('player-name').addEventListener('change', (e) => {
      localStorage.setItem('playerName', e.target.value);
    });
  }

  async loadCurrentRound() {
    try {
      const response = await this.apiClient.getCurrentRound(this.gameId);
      
      if (!response.success) {
        this.showError(response.error);
        return;
      }
      
      const data = response.data;
      
      // Check game state
      if (data.gameComplete) {
        this.showGameComplete(data);
        return;
      }
      
      if (!data.hasActiveRound) {
        this.showNoActiveRound(data);
        return;
      }
      
      // Active round exists
      this.currentRound = data;
      this.displayActiveRound(data);
      
      // Load leaderboard
      await this.loadLeaderboard();
      
    } catch (error) {
      this.showError('Failed to load game: ' + error.message);
    }
  }

  displayActiveRound(data) {
    // Hide message screens
    document.getElementById('no-round-message').style.display = 'none';
    document.getElementById('game-complete-message').style.display = 'none';
    document.querySelector('.main-content').style.display = 'flex';
    
    // Update header
    document.getElementById('game-name').textContent = data.gameName;
    document.getElementById('round-number').textContent = `Round ${data.roundNumber}`;
    
    // Update goal description
    const goal = data.puzzle.allGoals.find((g, i) => 
      !data.puzzle.completedGoalIndices.includes(i) && 
      g.position.x === data.puzzle.goalPosition.x &&
      g.position.y === data.puzzle.goalPosition.y
    );
    
    const goalText = data.puzzle.goalColor === 'multi'
      ? 'Get ANY robot to the purple goal'
      : `Get ${data.puzzle.goalColor} robot to goal`;
    
    document.getElementById('goal-description').textContent = goalText;
    
    // Find goal index
    const goalIndex = data.puzzle.allGoals.findIndex(g =>
      g.position.x === data.puzzle.goalPosition.x &&
      g.position.y === data.puzzle.goalPosition.y
    );
    
    // Load puzzle into controller
    this.controller.gameId = this.gameId;
    this.controller.roundId = data.roundId;
    this.controller.loadPuzzle(data.puzzle, goalIndex);
    
    // Start timer countdown
    this.startTimer(data.endTime);
  }

  showNoActiveRound(data) {
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('no-round-message').style.display = 'block';
    
    const stats = `
      <p>Goals completed: ${data.goalsCompleted} / 17</p>
      <p>Goals remaining: ${data.goalsRemaining}</p>
    `;
    document.getElementById('game-stats').innerHTML = stats;
  }

  showGameComplete(data) {
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('game-complete-message').style.display = 'block';
  }

  async loadLeaderboard() {
    try {
      const response = await this.apiClient.getLeaderboard(
        this.gameId,
        this.currentRound.roundId
      );
      
      if (response.success) {
        this.displayLeaderboard(response.data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }

  displayLeaderboard(data) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    if (data.solutions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No solutions yet. Be the first!</td></tr>';
      return;
    }
    
    data.solutions.forEach(solution => {
      const row = document.createElement('tr');
      
      // Highlight current player
      const savedName = localStorage.getItem('playerName');
      if (savedName && solution.playerName.toLowerCase() === savedName.toLowerCase()) {
        row.classList.add('current-player');
      }
      
      row.innerHTML = `
        <td>${solution.rank}</td>
        <td>${solution.playerName}</td>
        <td>${solution.moveCount}</td>
        <td class="robot-${solution.winningRobot}">${solution.winningRobot}</td>
        <td>${this.formatTime(solution.submittedAt)}</td>
      `;
      
      tbody.appendChild(row);
    });
  }

  async submitSolution() {
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    
    if (this.controller.moveHistory.length === 0) {
      alert('No solution to submit');
      return;
    }
    
    try {
      const result = await this.controller.submitSolution(playerName);
      
      if (result.success) {
        alert(`Solution submitted! You used ${result.data.moveCount} moves. Current rank: #${result.data.rank}`);
        
        // Disable further submissions
        document.getElementById('submit-btn').disabled = true;
        
        // Reload leaderboard
        await this.loadLeaderboard();
      }
    } catch (error) {
      alert('Failed to submit: ' + error.message);
    }
  }

  startPolling() {
    // Poll every 20 seconds
    this.pollingInterval = setInterval(async () => {
      const oldRoundId = this.currentRound?.roundId;
      
      await this.loadCurrentRound();
      
      // Check if round changed
      if (this.currentRound && this.currentRound.roundId !== oldRoundId) {
        // New round started!
        this.showNotification('New round started!');
      }
      
      // Reload leaderboard if round is active
      if (this.currentRound && this.currentRound.hasActiveRound !== false) {
        await this.loadLeaderboard();
      }
    }, 20000);
  }

  startTimer(endTime) {
    const timerElement = document.getElementById('time-remaining');
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      if (remaining === 0) {
        timerElement.textContent = 'Round ended';
        return;
      }
      
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  showError(message) {
    document.querySelector('.container').innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
      </div>
    `;
  }

  showNotification(message) {
    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PlayerApp();
});
```

#### Success Criteria
- ✅ Game loads from URL parameter
- ✅ Polling updates every 20s
- ✅ Timer countdown works
- ✅ Submit solution works
- ✅ Leaderboard updates
- ✅ Round transitions detected
- ✅ LocalStorage for player name

---

### Task 7: Player UI - CSS Styling
**Estimated Time:** 2 hours  
**Priority:** Medium  
**Dependencies:** Task 5

#### What to Build

**Files:**
- `client/css/shared.css` - Base styles and variables
- `client/css/game.css` - Player UI specific styles

#### Key Styles

```css
/* shared.css */
:root {
  --color-red: #E74C3C;
  --color-yellow: #F39C12;
  --color-green: #27AE60;
  --color-blue: #3498DB;
  --color-multi: #9B59B6;
  --color-bg: #ECF0F1;
  --color-card: #FFFFFF;
  --color-text: #2C3E50;
  --color-border: #BDC3C7;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
}

/* game.css */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background: var(--color-card);
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.main-content {
  display: flex;
  gap: 20px;
}

.game-section {
  flex: 2;
  background: var(--color-card);
  padding: 20px;
  border-radius: 8px;
}

#game-board {
  border: 2px solid var(--color-border);
  border-radius: 4px;
  display: block;
  margin: 20px auto;
}

.robot-selectors {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.robot-selector {
  flex: 1;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.robot-selector[data-robot="red"] {
  background: var(--color-red);
  color: white;
}

.robot-selector[data-robot="yellow"] {
  background: var(--color-yellow);
  color: white;
}

.robot-selector[data-robot="green"] {
  background: var(--color-green);
  color: white;
}

.robot-selector[data-robot="blue"] {
  background: var(--color-blue);
  color: white;
}

.robot-selector.selected {
  border-color: var(--color-text);
  transform: scale(1.05);
}

.leaderboard-section {
  flex: 1;
  background: var(--color-card);
  padding: 20px;
  border-radius: 8px;
}

#leaderboard {
  width: 100%;
  border-collapse: collapse;
}

#leaderboard th,
#leaderboard td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.current-player {
  background: #FFF9C4;
  font-weight: bold;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  #game-board {
    max-width: 100%;
    height: auto;
  }
}
```

#### Success Criteria
- ✅ Clean, modern design
- ✅ Color-coded robots
- ✅ Responsive layout
- ✅ Mobile-friendly
- ✅ Accessible (WCAG AA)

---

### Task 8: Host Panel - HTML Structure
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Task 1

#### What to Build
**File:** `client/host.html`

Host control panel with game management UI.

#### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Host Panel - Async Ricochet Robots</title>
  <link rel="stylesheet" href="css/shared.css">
  <link rel="stylesheet" href="css/host.css">
</head>
<body>
  <div class="host-container">
    <header>
      <h1>🎮 Host Panel</h1>
      <div id="game-info">
        <span id="game-name"></span>
        <span id="game-id"></span>
      </div>
    </header>

    <!-- Game Statistics -->
    <section class="stats-section">
      <div class="stat-card">
        <h3>Total Rounds</h3>
        <div class="stat-value" id="total-rounds">0</div>
      </div>
      <div class="stat-card">
        <h3>Goals Completed</h3>
        <div class="stat-value" id="goals-completed">0 / 17</div>
      </div>
      <div class="stat-card">
        <h3>Total Players</h3>
        <div class="stat-value" id="total-players">0</div>
      </div>
      <div class="stat-card">
        <h3>Total Solutions</h3>
        <div class="stat-value" id="total-solutions">0</div>
      </div>
    </section>

    <!-- Current Round -->
    <section class="current-round-section">
      <h2>Current Round</h2>
      
      <div id="no-active-round" style="display: none;">
        <p>No active round</p>
        <button id="start-round-btn" class="primary-btn">Start New Round</button>
        
        <div class="round-config">
          <label>Duration:</label>
          <select id="round-duration">
            <option value="3600000">1 hour</option>
            <option value="21600000">6 hours</option>
            <option value="43200000">12 hours</option>
            <option value="86400000" selected>24 hours</option>
            <option value="172800000">48 hours</option>
          </select>
        </div>
      </div>
      
      <div id="active-round" style="display: none;">
        <div class="round-info">
          <div><strong>Round:</strong> <span id="current-round-number"></span></div>
          <div><strong>Goal:</strong> <span id="current-goal"></span></div>
          <div><strong>Solutions:</strong> <span id="current-solutions">0</span></div>
          <div><strong>Time Remaining:</strong> <span id="current-time-remaining"></span></div>
          <div><strong>Best Score:</strong> <span id="current-best-score">-</span></div>
        </div>
        
        <div class="round-actions">
          <button id="extend-round-btn" class="secondary-btn">Extend Deadline</button>
          <button id="end-round-btn" class="danger-btn">End Round</button>
        </div>
        
        <!-- Current Leaderboard -->
        <div class="current-leaderboard">
          <h3>Current Leaderboard</h3>
          <table id="current-leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Moves</th>
                <th>Robot</th>
              </tr>
            </thead>
            <tbody id="current-leaderboard-body"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Round History -->
    <section class="history-section">
      <h2>Round History</h2>
      <div id="round-history">
        <!-- Populated by JavaScript -->
      </div>
    </section>

    <!-- Share Links -->
    <section class="share-section">
      <h2>Share Links</h2>
      <div class="link-group">
        <label>Player Link:</label>
        <div class="link-input">
          <input type="text" id="player-link" readonly>
          <button onclick="copyToClipboard('player-link')">Copy</button>
        </div>
      </div>
      <div class="link-group">
        <label>Host Panel Link (keep private!):</label>
        <div class="link-input">
          <input type="text" id="host-link" readonly>
          <button onclick="copyToClipboard('host-link')">Copy</button>
        </div>
      </div>
    </section>
  </div>

  <script type="module" src="js/api-client.js"></script>
  <script type="module" src="js/host-panel.js"></script>
</body>
</html>
```

#### Success Criteria
- ✅ Complete host panel structure
- ✅ All control buttons present
- ✅ Statistics display areas
- ✅ Round history section
- ✅ Share links section

---

### Task 9: Host Panel - Application Logic
**Estimated Time:** 2 hours  
**Priority:** High  
**Dependencies:** Tasks 2, 8

#### What to Build
**File:** `client/js/host-panel.js`

Host panel controller with dashboard management.

#### Implementation

```javascript
import { ApiClient } from './api-client.js';

class HostPanel {
  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.gameId = params.get('game');
    this.hostKey = params.get('key');
    
    if (!this.gameId || !this.hostKey) {
      this.showError('Invalid host panel link');
      return;
    }
    
    this.apiClient = new ApiClient();
    this.pollingInterval = null;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadDashboard();
    this.startPolling();
  }

  setupEventListeners() {
    document.getElementById('start-round-btn').addEventListener('click', () => {
      this.startRound();
    });
    
    document.getElementById('extend-round-btn').addEventListener('click', () => {
      this.extendRound();
    });
    
    document.getElementById('end-round-btn').addEventListener('click', () => {
      this.endRound();
    });
  }

  async loadDashboard() {
    try {
      const response = await this.apiClient.getDashboard(this.gameId, this.hostKey);
      
      if (!response.success) {
        this.showError(response.error);
        return;
      }
      
      this.displayDashboard(response.data);
      
    } catch (error) {
      this.showError('Failed to load dashboard: ' + error.message);
    }
  }

  displayDashboard(data) {
    // Update header
    document.getElementById('game-name').textContent = data.gameName;
    document.getElementById('game-id').textContent = `Game ID: ${this.gameId}`;
    
    // Update statistics
    document.getElementById('total-rounds').textContent = data.totalRounds;
    document.getElementById('goals-completed').textContent = 
      `${data.goalsCompleted} / 17`;
    document.getElementById('total-players').textContent = 
      data.statistics.totalPlayers;
    document.getElementById('total-solutions').textContent = 
      data.statistics.totalSolutions;
    
    // Update share links
    const baseUrl = window.location.origin;
    document.getElementById('player-link').value = 
      `${baseUrl}/?game=${this.gameId}`;
    document.getElementById('host-link').value = 
      `${baseUrl}/host.html?game=${this.gameId}&key=${this.hostKey}`;
    
    // Display current round or no-round state
    if (data.currentRound) {
      this.displayActiveRound(data.currentRound);
    } else {
      this.displayNoActiveRound(data.gameComplete);
    }
    
    // Display round history
    this.displayRoundHistory(data.previousRounds);
  }

  displayActiveRound(round) {
    document.getElementById('no-active-round').style.display = 'none';
    document.getElementById('active-round').style.display = 'block';
    
    document.getElementById('current-round-number').textContent = round.roundNumber;
    document.getElementById('current-goal').textContent = 
      `${round.goalColor} at (${round.goalPosition.x}, ${round.goalPosition.y})`;
    document.getElementById('current-solutions').textContent = round.solutionCount;
    
    // Timer
    this.startTimer(round.endTime, 'current-time-remaining');
    
    // Best score
    if (round.topSolution) {
      document.getElementById('current-best-score').textContent = 
        `${round.topSolution.moveCount} moves by ${round.topSolution.playerName}`;
    }
    
    // Load current leaderboard
    this.loadCurrentLeaderboard(round.roundId);
  }

  displayNoActiveRound(gameComplete) {
    document.getElementById('active-round').style.display = 'none';
    document.getElementById('no-active-round').style.display = 'block';
    
    if (gameComplete) {
      document.getElementById('start-round-btn').disabled = true;
      document.getElementById('start-round-btn').textContent = 
        'Game Complete (All 17 Goals Done)';
    } else {
      document.getElementById('start-round-btn').disabled = false;
    }
  }

  async loadCurrentLeaderboard(roundId) {
    try {
      const response = await this.apiClient.getLeaderboard(this.gameId, roundId);
      
      if (response.success) {
        const tbody = document.getElementById('current-leaderboard-body');
        tbody.innerHTML = '';
        
        response.data.solutions.forEach(solution => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${solution.rank}</td>
            <td>${solution.playerName}</td>
            <td>${solution.moveCount}</td>
            <td>${solution.winningRobot}</td>
          `;
          tbody.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }

  displayRoundHistory(rounds) {
    const container = document.getElementById('round-history');
    container.innerHTML = '';
    
    if (!rounds || rounds.length === 0) {
      container.innerHTML = '<p>No completed rounds yet</p>';
      return;
    }
    
    rounds.forEach(round => {
      const card = document.createElement('div');
      card.className = 'history-card';
      
      const status = round.status === 'skipped' ? '⏭️ Skipped' : '✅ Completed';
      const winner = round.winner 
        ? `Winner: ${round.winner.playerName} (${round.winner.moveCount} moves)`
        : 'No solutions';
      
      card.innerHTML = `
        <div class="history-header">
          <h4>Round ${round.roundNumber}</h4>
          <span class="status-badge ${round.status}">${status}</span>
        </div>
        <div>Goal: ${round.goalColor}</div>
        <div>Solutions: ${round.solutionCount}</div>
        <div>${winner}</div>
      `;
      
      container.appendChild(card);
    });
  }

  async startRound() {
    const duration = parseInt(document.getElementById('round-duration').value);
    
    if (!confirm(`Start new round with ${duration / 3600000} hour duration?`)) {
      return;
    }
    
    try {
      const response = await this.apiClient.startRound(
        this.gameId,
        this.hostKey,
        duration
      );
      
      if (response.success) {
        alert(`Round ${response.data.roundNumber} started successfully!`);
        await this.loadDashboard();
      } else {
        alert('Failed to start round: ' + response.error);
      }
    } catch (error) {
      alert('Error starting round: ' + error.message);
    }
  }

  async extendRound() {
    const hours = prompt('Extend deadline by how many hours?', '6');
    
    if (!hours) return;
    
    const extendByMs = parseInt(hours) * 3600000;
    
    try {
      const roundId = this.currentRound.roundId; // Store from displayActiveRound
      const response = await this.apiClient.extendRound(
        this.gameId,
        this.hostKey,
        roundId,
        extendByMs
      );
      
      if (response.success) {
        alert(`Deadline extended by ${hours} hours`);
        await this.loadDashboard();
      } else {
        alert('Failed to extend: ' + response.error);
      }
    } catch (error) {
      alert('Error extending round: ' + error.message);
    }
  }

  async endRound() {
    const skip = confirm(
      'Skip this goal (it will be available again)?\n\n' +
      'Click OK to skip, Cancel to mark as completed.'
    );
    
    if (!confirm(`End this round${skip ? ' and skip goal' : ''}?`)) {
      return;
    }
    
    try {
      const roundId = this.currentRound.roundId;
      const response = await this.apiClient.endRound(
        this.gameId,
        this.hostKey,
        roundId,
        skip
      );
      
      if (response.success) {
        alert('Round ended successfully');
        await this.loadDashboard();
      } else {
        alert('Failed to end round: ' + response.error);
      }
    } catch (error) {
      alert('Error ending round: ' + error.message);
    }
  }

  startPolling() {
    this.pollingInterval = setInterval(async () => {
      await this.loadDashboard();
    }, 30000); // Poll every 30 seconds
  }

  startTimer(endTime, elementId) {
    const element = document.getElementById(elementId);
    
    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now());
      
      if (remaining === 0) {
        element.textContent = 'Ended';
        return;
      }
      
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      
      element.textContent = `${hours}h ${minutes}m`;
    };
    
    updateTimer();
    setInterval(updateTimer, 60000); // Update every minute
  }

  showError(message) {
    document.querySelector('.host-container').innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
      </div>
    `;
  }
}

// Helper function for copying links
window.copyToClipboard = (inputId) => {
  const input = document.getElementById(inputId);
  input.select();
  document.execCommand('copy');
  alert('Link copied to clipboard!');
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new HostPanel();
});
```

#### Success Criteria
- ✅ Dashboard loads correctly
- ✅ Start/extend/end round works
- ✅ Statistics update
- ✅ Round history displays
- ✅ Share links functional
- ✅ Polling updates dashboard

---

### Task 10: Host Panel - CSS Styling
**Estimated Time:** 1 hour  
**Priority:** Medium  
**Dependencies:** Task 8

#### What to Build
**File:** `client/css/host.css`

Styling for host panel interface.

#### Key Styles

```css
.host-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--color-card);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: var(--color-blue);
  margin-top: 10px;
}

.current-round-section,
.history-section,
.share-section {
  background: var(--color-card);
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.primary-btn {
  background: var(--color-green);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.primary-btn:hover {
  background: #229954;
}

.danger-btn {
  background: var(--color-red);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.history-card {
  background: #F8F9FA;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  border-left: 4px solid var(--color-blue);
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.status-badge.completed {
  background: #D4EDDA;
  color: #155724;
}

.status-badge.skipped {
  background: #FFF3CD;
  color: #856404;
}
```

#### Success Criteria
- ✅ Professional dashboard design
- ✅ Clear visual hierarchy
- ✅ Responsive grid layout
- ✅ Accessible controls

---

### Task 11: Testing & Polish
**Estimated Time:** 2 hours  
**Priority:** High  
**Dependencies:** All previous tasks

#### What to Test

1. **Player UI:**
   - Game loads correctly
   - Robot movement works
   - Solution submission successful
   - Leaderboard updates
   - Polling detects new rounds
   - Mobile responsive

2. **Host Panel:**
   - Dashboard loads
   - Start round works
   - Extend/end round works
   - Statistics accurate
   - Share links work

3. **Cross-Browser:**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers

4. **Error Handling:**
   - Invalid game ID
   - Network errors
   - Invalid host key
   - Missing player name

#### Success Criteria
- ✅ All features work end-to-end
- ✅ No console errors
- ✅ Smooth 60fps animations
- ✅ Works on mobile devices
- ✅ Graceful error handling

---

## Summary

### Total Estimated Time: **18-22 hours**

### Task Dependencies

```
Task 1 (Structure)
  ↓
Task 2 (API Client) ← Task 3 (Renderer) ← Task 4 (Controller)
  ↓                        ↓                      ↓
Task 5 (Player HTML) ← Task 6 (Player App) ← Task 7 (Player CSS)
  ↓
Task 8 (Host HTML) ← Task 9 (Host App) ← Task 10 (Host CSS)
  ↓
Task 11 (Testing & Polish)
```

### Deployment Checklist

Before deploying to Azure Static Web Apps:
- [ ] All tests passing
- [ ] API URLs point to production
- [ ] CORS configured correctly
- [ ] Static assets optimized
- [ ] Mobile testing complete
- [ ] Error handling tested
- [ ] Performance verified (Lighthouse >90)

### Next Steps After Phase 4

1. Deploy to Azure Static Web Apps
2. Configure custom domain (optional)
3. User acceptance testing
4. Bug fixes and optimizations
5. Documentation updates
6. Feature enhancements (Phase 5+)

### Key Principles

1. **Progressive Enhancement:** Works without JavaScript where possible
2. **Performance:** 60fps animations, fast page loads
3. **Accessibility:** WCAG AA compliance
