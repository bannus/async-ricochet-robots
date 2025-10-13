# Tech Context: Async Ricochet Robots

## Technology Stack

### Frontend
- **Language**: TypeScript 5.x (strict mode)
- **Build Tool**: Webpack 5
- **Rendering**: HTML5 Canvas API
- **Styling**: Custom CSS (no framework)
- **Dependencies**: Minimal (Hammer.js for touch gestures only)

### Backend
- **Runtime**: Node.js 18 LTS
- **Language**: TypeScript 5.x (strict mode)
- **Platform**: Azure Functions v4
- **Framework**: @azure/functions v4.x
- **Storage**: Azure Table Storage SDK

### Development Tools
- **IDE**: Visual Studio Code
- **Package Manager**: npm
- **Testing**: Jest 29.x
- **Linting**: TypeScript compiler (strict mode)
- **Local Storage**: Azurite (Azure Storage Emulator)
- **Local Functions**: Azure Functions Core Tools v4

## Project Structure

```
async-ricochet-robots/
├── client/                 # Frontend application
│   ├── src/               # TypeScript source
│   ├── css/               # Stylesheets
│   ├── lib-shared/        # Game engine (copied from /shared)
│   ├── assets/            # Static assets (Hammer.js)
│   ├── index.html         # Main HTML
│   └── package.json       # Frontend dependencies
├── api/                   # Backend Azure Functions
│   ├── src/functions/     # Function endpoints
│   ├── shared/            # API utilities (storage, validation)
│   ├── lib-shared/        # Game engine (copied from /shared)
│   └── package.json       # API dependencies
├── shared/                # Source of truth for game engine
│   ├── types.ts           # Core type definitions
│   ├── game-engine.ts     # Robot movement logic
│   ├── wall-utils.ts      # Wall collision detection
│   ├── solution-validator.ts  # Solution validation
│   ├── l-shape-utils.ts   # L-shape wall generation
│   └── goal-placement.ts  # Goal distribution logic
├── tests/                 # Test suites
│   ├── unit/              # Unit tests (Jest)
│   ├── integration/       # Integration tests
│   └── manual/            # Manual test scenarios
├── doc/                   # Documentation
└── memory-bank/           # Context preservation
```

## Dependencies

### Client Dependencies
```json
{
  "devDependencies": {
    "@types/hammerjs": "^2.0.45",
    "@types/minimatch": "^5.1.2",
    "ts-loader": "^9.5.1",
    "typescript": "^5.7.2",
    "webpack": "^5.97.1",
    "webpack-cli": "^6.0.1"
  }
}
```

**Rationale**:
- `@types/hammerjs` - TypeScript definitions for Hammer.js (touch gestures)
- `@types/minimatch` - Required by SWA CLI dependency
- `webpack` - Bundles TypeScript into single JS file
- No runtime dependencies (Hammer.js included as static asset)

### API Dependencies
```json
{
  "dependencies": {
    "@azure/data-tables": "^13.2.2",
    "@azure/functions": "^4.5.0"
  },
  "devDependencies": {
    "@azure/static-web-apps-cli": "^2.0.1",
    "typescript": "^5.7.2"
  }
}
```

**Rationale**:
- `@azure/data-tables` - Azure Table Storage client
- `@azure/functions` - Azure Functions v4 programming model
- `@azure/static-web-apps-cli` - Local development emulator

### Test Dependencies
```json
{
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.2"
  }
}
```

## Build Configuration

### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true
  }
}
```

**Key Settings**:
- `strict: true` - Maximum type safety
- `sourceMap: true` - Enables debugging
- `target: ES2020` - Modern JavaScript features
- `lib: ["DOM"]` - For client-side APIs

### Webpack (client)
```javascript
{
  entry: './src/player-app.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  }
}
```

**Build Output**:
- `client/dist/bundle.js` - Bundled application (~45KB)
- `client/dist/bundle.js.map` - Source map for debugging

### Azure Functions (api)
```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

## Development Setup

### Initial Setup
```bash
# Install root dependencies (Jest for testing)
npm install

# Install client dependencies
cd client
npm install

# Install API dependencies
cd ../api
npm install

# Return to root
cd ..
```

### Development Workflow

#### Option 1: Full-Stack Debugging (Recommended)
```bash
# Press F5 in VS Code
# Automatically:
# - Builds client + API
# - Starts SWA emulator on port 4280
# - Launches Chrome with debugger
# - Attaches Node debugger to API
```

**Ports**:
- `4280` - SWA emulator (client + API proxy)
- `7071` - Azure Functions (internal)
- `9229` - Node debugger

#### Option 2: Manual Development
```bash
# Terminal 1: Start client with watch
cd client
npm run dev  # Builds + watches + serves on port 8080

# Terminal 2: Start API
cd api
npm start  # Starts Azure Functions on port 7071

# Terminal 3: Start Azurite (if not auto-started)
azurite --silent --location ./azurite --debug ./azurite/debug.log
```

### Testing

#### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- shared/game-engine.test.ts

# Watch mode
npm test -- --watch
```

#### API Integration Tests
```bash
# Start Azurite + Functions first
cd api
npm start

# Run API tests (in new terminal)
npm test -- tests/integration/api-integration.test.ts
```

#### Manual API Tests
```bash
# Use VS Code REST Client extension
# Open: tests/manual/manual-api-tests.http
# Click "Send Request" on any scenario
```

## VS Code Configuration

### Launch Configurations (.vscode/launch.json)
1. **Debug Full Stack (SWA)** - Primary workflow
2. **Debug Client Only** - Frontend-only debugging
3. **Attach to API (Node)** - API-only debugging

See `doc/DEBUGGING.md` for complete guide.

### Tasks (.vscode/tasks.json)
- **Build Client** - One-time webpack build
- **Build API** - One-time TypeScript compilation
- **Watch Client** - TypeScript watch mode
- **Watch API** - TypeScript watch mode
- **Start SWA Emulator** - Full-stack local environment

## Azure Configuration

### Static Web App (staticwebapp.config.json)
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
  }
}
```

### Azure Functions (host.json)
```json
{
  "version": "2.0",
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

**CORS Configuration**:
```json
{
  "extensions": {
    "http": {
      "customHeaders": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Host-Key"
      }
    }
  }
}
```

## Environment Variables

### Development (Local)
```bash
# API uses these (set in api/local.settings.json)
AzureWebJobsStorage=UseDevelopmentStorage=true  # Points to Azurite
FUNCTIONS_WORKER_RUNTIME=node

# Client (no env vars needed - uses relative paths)
```

### Production (Azure)
```bash
# Static Web App
# No manual configuration needed

# Managed Functions (auto-configured by SWA)
# DO NOT SET: AzureWebJobsStorage (forbidden for Managed Functions)
FUNCTIONS_WORKER_RUNTIME=node
```

## Performance Characteristics

### Client
- **Bundle Size**: ~45KB (minified)
- **Load Time**: <500ms (on fast connection)
- **Render Performance**: 60fps on 16×16 grid
- **Memory Usage**: ~10MB

### API
- **Cold Start**: 1-2 seconds (acceptable for async game)
- **Warm Response**: <200ms average
- **Storage Query**: <100ms (single partition)
- **Timer Function**: <5s execution (checks all games)

### Network
- **Polling Interval**: 20 seconds
- **API Request Size**: <5KB typical
- **API Response Size**: <10KB typical
- **Total Bandwidth**: ~30KB per minute per player

## Technical Constraints

### Azure Free Tier Limits
- **Static Web Apps**: 100GB bandwidth/month
- **Functions**: 1M executions/month, 400K GB-s/month
- **Table Storage**: 5GB storage, unlimited transactions

### Browser Requirements
- **JavaScript**: ES2020 support (modern browsers)
- **Canvas**: HTML5 Canvas API
- **Storage**: LocalStorage API
- **Fetch**: Fetch API for HTTP requests

### TypeScript Strict Mode
All code compiled with:
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `strictPropertyInitialization: true`

## Troubleshooting

### Common Issues

**1. "Cannot find module" in API**
- **Cause**: lib-shared/ not synced with shared/
- **Fix**: Copy shared/ contents to api/lib-shared/

**2. "CORS error" in browser**
- **Cause**: API not configured for CORS
- **Fix**: Check api/host.json has CORS headers

**3. "Breakpoints not hitting"**
- **Cause**: Source maps not generated
- **Fix**: Ensure `"sourceMap": true` in tsconfig.json

**4. "Storage emulator not started"**
- **Cause**: Azurite not running
- **Fix**: Run `azurite` or use SWA CLI (auto-starts)

**5. "Function not found" in Azure**
- **Cause**: Deployment didn't include functions
- **Fix**: Check GitHub Actions build logs

## Deployment

### GitHub Actions Workflow
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/client"
          api_location: "/api"
          output_location: "dist"
```

### Production URL
https://icy-glacier-0f757cb0f.1.azurestaticapps.net/

## Version History

- **v1.0.0** - Initial release (October 2025)
  - Full gameplay implementation
  - 17-goal system
  - L-shaped wall generation
  - Multi-color goal support
  - Host panel integration
  - Mobile touch controls (Hammer.js)

## Future Considerations

### Potential Upgrades
- **TypeScript 5.x features** - As they stabilize
- **Webpack 6** - When released
- **Azure Functions v5** - When available
- **React/Vue** - If complexity increases (currently not needed)

### Known Limitations
- **No offline mode** - Requires internet connection
- **No real-time updates** - 20-second polling delay
- **No mobile app** - Web-only (responsive design)
- **Limited scalability** - Free tier constraints
