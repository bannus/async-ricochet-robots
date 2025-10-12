# Debugging Guide

Guide for debugging the Async Ricochet Robots application in VS Code with full-stack breakpoint support.

## Overview

The project is configured for compound debugging, allowing you to debug both the frontend (client) and backend (API) simultaneously in VS Code.

## Setup

### Prerequisites

- **VS Code** with the following extensions installed:
  - **Debugger for Chrome** (or Edge) - for client-side debugging
  - **Azure Functions** extension (optional, but recommended)
- **Chrome** or **Edge** browser installed
- Project dependencies installed (`npm install` in root, client, and api directories)

## Debugging Configurations

### 1. Debug Full Stack (SWA) - **RECOMMENDED**

This is the primary debugging workflow using Azure Static Web Apps CLI.

**What it does:**
- Starts Azurite (local Azure Storage emulator)
- Builds both client and API
- Starts SWA emulator on `http://localhost:4280`
- Launches Chrome with debugger attached
- Attaches Node debugger to API (port 9229)
- Allows breakpoints in both client `.ts` files and API functions

**How to use:**
1. Press **F5** or click **Run → Start Debugging**
2. Select **"Debug Full Stack (SWA)"** from the dropdown
3. VS Code will:
   - Build client and API
   - Start SWA emulator
   - Launch Chrome
   - Attach debuggers
4. Set breakpoints in any `.ts` file (client or API)
5. Interact with the app in the browser
6. Debugger will pause at breakpoints

**Ports:**
- Client + API: `http://localhost:4280` (SWA emulator)
- API backend: `http://localhost:7071` (Azure Functions, internal)
- Node debugger: `9229`

**How API Routing Works:**

The SWA emulator acts as a reverse proxy:
```
Browser → http://localhost:4280/api/createGame
          ↓ (SWA emulator proxies)
          → http://localhost:7071/api/createGame (Azure Functions)
          ↓ (response)
Browser ← http://localhost:4280/api/createGame
```

**Important:** The client code uses relative paths (`/api/*`) when running on port 4280, allowing the SWA emulator to proxy requests. This:
- ✅ Avoids CORS issues (same origin)
- ✅ Avoids CSP violations (no cross-port requests)
- ✅ Matches production behavior (Azure Static Web Apps)

### 2. Debug Client Only

For debugging only the frontend without the API.

**What it does:**
- Launches Chrome pointing to `http://localhost:8080`
- Debugs client-side TypeScript only

**How to use:**
1. First, start the client dev server:
   ```bash
   npm run dev:client
   ```
2. In VS Code, select **"Debug Client Only"**
3. Press **F5**

**Note:** This assumes you're using live-server on port 8080. API calls will fail unless API is running separately.

### 3. Attach to API (Node)

For debugging only the API when it's already running.

**What it does:**
- Attaches Node debugger to running Azure Functions instance

**How to use:**
1. Start API with debugging enabled:
   ```bash
   cd api
   npm start
   ```
2. In VS Code, select **"Attach to API (Node)"**
3. Press **F5**
4. Set breakpoints in API functions

## Typical Workflows

### Full-Stack Development

**Best for:** Developing features that span client and API

```bash
# Just press F5 and select "Debug Full Stack (SWA)"
# Everything starts automatically!
```

The SWA emulator will:
- Serve client files from `client/dist`
- Proxy `/api/*` routes to Azure Functions
- Provide production-like routing

### Client-Only Development

**Best for:** Working on UI/UX without API changes

```bash
# Terminal 1: Start client with watch + serve
npm run dev:client

# VS Code: Select "Debug Client Only" and press F5
```

### API-Only Development

**Best for:** Testing API endpoints directly

```bash
# Terminal 1: Start API
cd api
npm start

# VS Code: Select "Attach to API (Node)" and press F5
# Test API with: tests/manual/manual-api-tests.http
```

## Setting Breakpoints

### Client-Side Breakpoints

1. Open any `.ts` file in `client/src/`
2. Click in the gutter (left of line numbers) to set breakpoint
3. Red dot appears
4. Debugger will pause when that line executes in the browser

**Example:**
```typescript
// client/src/game-controller.ts
handleMove(direction: Direction) {
  debugger; // Or set breakpoint on this line
  const result = moveRobot(this.robots, this.selectedRobot, direction, this.walls);
  // ...
}
```

### API Breakpoints

1. Open any function file in `api/src/functions/`
2. Set breakpoint inside the function handler
3. Trigger the API endpoint (via browser or HTTP client)
4. Debugger pauses in VS Code

**Example:**
```typescript
// api/src/functions/createGame.ts
export async function createGame(request: HttpRequest, context: InvocationContext) {
  debugger; // Or set breakpoint here
  const hostId = request.query.get('hostId');
  // ...
}
```

## Debugging Tips

### Use the Debug Console

When paused at a breakpoint:
- **Variables panel** - inspect local variables
- **Watch panel** - add expressions to monitor
- **Call Stack panel** - see function call hierarchy
- **Debug Console** - evaluate expressions

### Conditional Breakpoints

Right-click on a breakpoint → Edit Breakpoint → Add condition:
```javascript
robotId === 'red'
round.goalIndex === 5
```

### Logpoints

Instead of `console.log()`, use logpoints:
1. Right-click in gutter
2. Add Logpoint
3. Enter message: `Robot moved to {x}, {y}`

### Source Maps

TypeScript source maps are enabled, so:
- Breakpoints work in `.ts` files (not compiled `.js`)
- Stack traces show TypeScript line numbers
- Variable names match source code

## Troubleshooting

### "Breakpoint not hitting in client"

1. Ensure source maps are enabled (`tsconfig.json` has `"sourceMap": true`)
2. Rebuild client: `npm run build --prefix client`
3. Hard refresh browser: `Ctrl+Shift+R`
4. Check DevTools console for source map warnings

### "Cannot attach to API"

1. Ensure API is running: `cd api && npm start`
2. Check API started with Node debugger on port 9229
3. Look for: `Debugger listening on ws://127.0.0.1:9229`
4. Try restarting API

### "SWA emulator not starting"

1. Ensure both client and API are built:
   ```bash
   npm run swa:build
   ```
2. Check ports 4280 and 7071 are not in use
3. Kill any running processes:
   ```bash
   # PowerShell
   Stop-Process -Name "func","node","swa" -Force -ErrorAction SilentlyContinue
   ```

### "Source file not found in debugger"

Check `sourceMapPathOverrides` in `.vscode/launch.json` match your build output structure.

## VS Code Tasks

Additional tasks available via **Terminal → Run Task**:

- **Build Client** - One-time client build
- **Build API** - One-time API build
- **Watch Client** - TypeScript watch mode for client
- **Watch API** - TypeScript watch mode for API
- **Client: Dev Mode** - Watch + serve on port 8080
- **API: Start** - Start Azure Functions host

## Keyboard Shortcuts

- **F5** - Start debugging (or continue)
- **Shift+F5** - Stop debugging
- **Ctrl+Shift+F5** - Restart debugging
- **F9** - Toggle breakpoint
- **F10** - Step over
- **F11** - Step into
- **Shift+F11** - Step out
- **Ctrl+Shift+B** - Run build task

## Additional Resources

- [VS Code Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Azure Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/)
