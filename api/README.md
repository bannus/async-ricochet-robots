# Azure Functions API

This directory contains the Azure Functions backend for Async Ricochet Robots.

## Shared Code Management

The API uses shared game engine code from the parent `../shared/` directory. This code is automatically synced during the build process.

### How It Works

1. **Source of Truth**: All shared game logic lives in `../shared/`
2. **Auto-Sync**: Files are automatically copied to `api/lib-shared/` during build
3. **Git Ignore**: `api/lib-shared/` is in `.gitignore` (auto-generated, not tracked)
4. **Build Process**: The `copy:shared` script runs before TypeScript compilation

### Available Scripts

```bash
# Build the project (auto-syncs shared files first)
npm run build

# Clean build artifacts and synced files
npm run clean

# Start Azure Functions locally (builds first)
npm start

# Watch mode (syncs once, then watches for TypeScript changes)
npm run watch

# Manually sync shared files (rarely needed)
npm run copy:shared

# Manually clean synced files
npm run clean:shared
```

### Development Workflow

1. **Edit shared code** in `../shared/` directory
2. **Run build** to sync changes: `npm run build`
3. **Test locally** with: `npm start`

The build process automatically:
- Copies files from `../shared/` to `lib-shared/`
- Compiles TypeScript
- Prepares functions for deployment

### Important Notes

- ✅ **DO** edit files in `../shared/` for game engine changes
- ❌ **DON'T** edit files in `api/lib-shared/` (they will be overwritten)
- ✅ **DO** run `npm run build` after changing shared files
- ✅ **DO** commit changes to `../shared/` to git
- ❌ **DON'COMMIT** the `api/lib-shared/` directory (it's auto-generated)

### File Structure

```
api/
├── lib-shared/          # Auto-generated (not in git)
│   ├── game-engine.ts   # Copied from ../shared/
│   ├── types.ts
│   └── ...
├── shared/              # API-specific shared code
│   ├── storage.ts       # Azure Table Storage logic
│   └── validation.ts    # Request validation
├── createGame/          # Function endpoints
├── submitSolution/
└── ...
```

### Deployment

The deployment process works seamlessly because:
1. `npm run build` is called before deployment
2. This syncs shared files to `lib-shared/`
3. All code is packaged and deployed together
4. No manual copying required!

### Troubleshooting

**Build errors about missing modules?**
- Run `npm run clean && npm run build`

**Functions not finding shared code?**
- Check that `lib-shared/` directory exists and has .ts files
- Run `npm run copy:shared` to manually sync

**Changes to shared code not reflected?**
- Make sure you ran `npm run build` after editing `../shared/`
- The watch mode doesn't auto-sync file changes from parent directory
