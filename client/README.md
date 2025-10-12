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
- Backend API running (see `/api/README.md`)

### Installation

```bash
# Install dependencies
npm install
```

### Running Locally

**Recommended: F5 Debugging with SWA Emulator**

For full-stack development with debugging support:

```bash
# Just press F5 in VS Code!
# Selects "Debug Full Stack (SWA)" configuration
```

This starts:
- SWA emulator on `http://localhost:4280`
- Client served from `client/dist`
- API proxied from Azure Functions (port 7071)
- Full debugging support for client and API code

See `doc/DEBUGGING.md` for complete debugging guide.

**Alternative: Standalone Client Development**

For frontend-only work without API:

```bash
# From root directory
npm run dev:client

# Or from client directory
cd client
npm run dev
```

This starts:
- TypeScript compiler in watch mode (auto-recompiles on save)
- Live server on http://localhost:8080 (auto-reloads browser)

**Note:** With standalone mode, API calls will fail unless you separately run the API server (`cd api && npm start`) and have CORS configured.

### Available Commands

```bash
# Development mode (watch + serve)
npm run dev              # Run from client/
npm run dev:client       # Run from root/

# Build and serve (one-time build)
npm start                # Run from client/
npm run start:client     # Run from root/

# Individual commands
npm run build            # Full build (includes copy:shared + copy:static)
npm run watch            # TypeScript watch mode only
npm run serve            # Live server only (port 8080)
npm run build:once       # One-time build (alias for build)
```

### Building for Production

```bash
# One-time build
npm run build
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
