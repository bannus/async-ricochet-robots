# Async Ricochet Robots - Frontend

Browser-based frontend for the Async Ricochet Robots game built with TypeScript, HTML5 Canvas, and vanilla CSS.

## Technology Stack

- **Language:** TypeScript (ES2020)
- **Modules:** ES6 native modules (`type="module"`)
- **Build:** TypeScript compiler (`tsc`)
- **Dev Server:** Live Server (VS Code extension)
- **Rendering:** HTML5 Canvas API

## Project Structure

```
client/
├── src/                    # TypeScript source files
│   ├── api-client.ts      # API wrapper
│   ├── game-renderer.ts   # Canvas rendering
│   ├── game-controller.ts # Player input & game logic
│   ├── player-app.ts      # Player UI main app
│   └── host-panel.ts      # Host dashboard
├── dist/                   # Compiled JavaScript (git-ignored)
├── css/                    # Stylesheets
│   ├── shared.css         # Variables & base styles
│   ├── game.css           # Player UI styles
│   └── host.css           # Host panel styles
├── index.html              # Player UI
├── host.html               # Host panel
└── staticwebapp.config.json # Azure Static Web Apps config
```

## Development Setup

### Prerequisites

- Node.js 18+ installed
- VS Code with Live Server extension (`ritwickdey.LiveServer`)
- Backend API running (see `/api/README.md`)

### Installation

```bash
# Install dependencies
npm install
```

### Running Locally

**Three-terminal workflow:**

```bash
# Terminal 1: Start backend API
cd api
npm start
# API runs on http://localhost:7071

# Terminal 2: Build frontend (auto-compile on save)
cd client
npm run build
# TypeScript compiler watches for changes

# Terminal 3: Start Live Server
# In VS Code: Click "Go Live" in bottom-right status bar
# Or right-click index.html → "Open with Live Server"
# Frontend runs on http://localhost:5500
```

### Building for Production

```bash
# One-time build (no watch mode)
npm run build:once
```

## Development Workflow

1. **Edit TypeScript files** in `src/`
2. **Auto-compile** with `npm run build` (Terminal 2)
3. **Live Server** auto-refreshes browser
4. **Test locally** with backend API running

## File Organization

### Player UI (`index.html`)

- Canvas game board with robot movement
- Interactive controls (keyboard & mouse)
- Move history and solution submission
- Live leaderboard with polling

### Host Panel (`host.html`)

- Game statistics dashboard
- Round management controls
- Player activity monitoring
- Share links generation

## Import Strategy

**Shared Game Engine & Types:**
```typescript
// Import from root /shared (compiled to dist/shared)
import { moveRobot } from '../../shared/game-engine.js';
import type { Position, Robots, Walls, Goal } from '../../shared/types.js';
```

**Local Modules:**
```typescript
// Import from local src files (compiled to dist/client/src)
import { ApiClient } from './api-client.js';
import { GameRenderer } from './game-renderer.js';
```

**Note:** TypeScript compiles both `/shared` and `/client/src` into `/client/dist`, maintaining the directory structure. The compiled output includes both `dist/shared/` and `dist/client/src/`.

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions  
- Safari: Latest 2 versions
- Mobile: iOS Safari 14+, Chrome Android latest

All support ES2020 and ES6 modules natively.

## Key Features

### Player UI
- 16×16 Canvas game board
- Real-time robot movement with animations
- Keyboard controls (R/Y/G/B + arrows)
- Mouse controls (click to select robot)
- Move history tracking
- Solution validation
- Live leaderboard (20s polling)
- LocalStorage for player name

### Host Panel
- Game statistics dashboard
- Round creation & management
- Deadline extension
- Goal skip functionality
- Round history
- Shareable game links

## CORS Configuration

For local development, ensure `api/host.json` includes:

```json
{
  "cors": {
    "allowedOrigins": ["http://localhost:5500"],
    "supportCredentials": false
  }
}
```

## Deployment

Deploy to Azure Static Web Apps:

1. Build TypeScript: `npm run build:once`
2. Commit `dist/` files
3. Deploy via Azure Static Web Apps GitHub integration
4. Static Web Apps automatically serves `/api` routes

## Performance Targets

- **Page Load:** < 2 seconds
- **Canvas Rendering:** 60 FPS
- **Lighthouse Score:** > 90
- **Bundle Size:** < 100KB (uncompressed)

## Testing

Test manually with:
- Different screen sizes (responsive design)
- Multiple browsers
- Network throttling (slow 3G)
- Invalid game IDs
- Missing API connection

## Troubleshooting

**Issue: Module not found errors**
- Ensure TypeScript compiled: `npm run build:once`
- Check imports use `.js` extension (not `.ts`)
- Verify file paths relative to HTML location

**Issue: CORS errors**
- Check API is running on port 7071
- Verify `host.json` includes localhost:5500
- Ensure using Live Server (not file://)

**Issue: Blank screen**
- Open browser console for errors
- Check API connection
- Verify game ID in URL parameter

## Next Steps

See `/doc/implementation/phase4.md` for detailed implementation plan.
