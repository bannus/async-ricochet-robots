# Active Context: Async Ricochet Robots

## Current Status

**Phase:** Phase 4 - Frontend UI (IN PROGRESS) 🔄  
**Date:** October 11, 2025  
**Completion:** ~85%  
**Next Milestone:** Complete CSS styling, E2E testing

## VS Code F5 Debugging Setup (October 12, 2025)

### Full-Stack Debugging with Azure SWA CLI ✅ COMPLETE

**Implementation Complete:**
- ✅ VS Code launch configurations (`.vscode/launch.json`)
- ✅ VS Code task automation (`.vscode/tasks.json`)
- ✅ Azure SWA CLI integration (`@azure/static-web-apps-cli`)
- ✅ API endpoint detection logic in `api-client.ts`
- ✅ Documentation in `doc/DEBUGGING.md`

**How It Works:**

Press **F5** in VS Code to start full-stack debugging:
1. **Task auto-runs:** "Start SWA Emulator" builds client + API
2. **SWA emulator starts:** Serves on `http://localhost:4280`
3. **Chrome launches:** With debugger attached to port 4280
4. **Node debugger attaches:** To Azure Functions on port 9229
5. **Set breakpoints:** In both client `.ts` and API `.ts` files

**Port Configuration:**
- `4280` - SWA emulator (serves client + proxies API)
- `7071` - Azure Functions (internal, started by SWA CLI)
- `9229` - Node debugger port
- `8080` - Alternative: standalone client (live-server)

**API Routing Architecture:**

The SWA emulator acts as a reverse proxy:
```
Browser: http://localhost:4280/api/createGame
         ↓ (client detects port 4280, uses relative path)
         fetch('/api/createGame')
         ↓ (SWA emulator proxies)
         → http://localhost:7071/api/createGame (Azure Functions)
         ↓ (response)
Browser: ← result
```

**Critical Fix Applied:**

Updated `client/src/api-client.ts` constructor to detect environment:
```typescript
if (window.location.port === '4280') {
  // SWA emulator - use relative path (let emulator proxy)
  this.baseUrl = '/api';
} else if (window.location.port === '8080') {
  // Live-server - point directly to Functions
  this.baseUrl = 'http://localhost:7071/api';
} else {
  // Production or other - use relative path
  this.baseUrl = '/api';
}
```

**Benefits:**
- ✅ No CORS issues (same origin via proxy)
- ✅ No CSP violations (no cross-port requests)
- ✅ Matches production behavior
- ✅ Debugging works for both client and API code
- ✅ One-button start (F5)

**Debugging Issue Resolved:**

Initial F5 setup failed with TypeScript build error:
- **Error:** `Cannot find type definition file for 'minimatch'`
- **Cause:** SWA CLI dependency needed `@types/minimatch` in client
- **Fix Applied:**
  1. Installed `@types/minimatch` in `client/package.json`
  2. Added `"types": []` to `client/tsconfig.json` to prevent auto-inclusion
- **Result:** ✅ Build succeeds, F5 debugging fully operational

**Documentation Updates:**
- ✅ `doc/DEBUGGING.md` - Complete debugging guide with API routing explanation
- ✅ `client/README.md` - Added F5 as recommended development workflow
- ✅ `README.md` - Quick reference for F5 debugging
- ✅ `memory-bank/activeContext.md` - This section!

## Recent Deployment Fix (October 10, 2025)

### Azure Functions v4 Deployment Success ✅

**Issue Resolved**: API deployment was failing with "Failed to deploy the Azure Functions"

**Root Cause Identified**:
- Forbidden app setting `AzureWebJobsStorage` was configured in Azure Static Web App
- Azure Static Web Apps uses **Managed Functions** which automatically handles storage
- Manually setting `AzureWebJobsStorage` conflicts with managed system
- Deployment was rejected before it even started

**Solution Applied**:
1. Accessed Azure Portal → Static Web App → Configuration → Application Settings
2. Removed the `AzureWebJobsStorage` setting
3. Triggered new deployment via git push
4. **Result**: ✅ Deployment successful, all API functions operational

**Key Learnings**:
- Azure Static Web Apps Managed Functions handle storage automatically
- DO NOT manually configure `AzureWebJobsStorage` for SWA deployments
- Standalone Azure Functions apps NEED this setting; SWA Managed Functions DON'T
- Initial troubleshooting incorrectly suspected Functions v4 compatibility issues
- Actual issue was simpler: forbidden configuration setting

**Documentation Updated**:
- ✅ `doc/DEPLOYMENT.md` - Added version history entry with fix details
- ✅ Included warning about not setting AzureWebJobsStorage for Managed Functions

## Recent Changes (October 8-13, 2025)

### Bug Fix: No Mobile Robot Movement ✅ FIXED (October 13, 2025)

**Critical Bug Resolved:**
- **Issue:** Game was completely unusable on mobile devices - no touch controls for robot movement
- **Root Causes:**
  1. No touch event handlers implemented (game was keyboard-only)
  2. Desktop mouse clicks not working (double coordinate conversion bug)
- **Solution:** Integrated Hammer.js library for unified touch and mouse controls
- **Implementation:**
  - Downloaded Hammer.js v2.0.8 locally to `client/assets/hammer.min.js` (20KB)
  - Added `@types/hammerjs` for TypeScript type definitions
  - Configured swipe gesture detection for robot movement
  - Added native click handler for desktop (more reliable than Hammer tap)
  - Fixed double `getBoundingClientRect()` subtraction bug in click coordinates
  - Applied CSS touch optimizations (`touch-action: none`, no text selection, no tap highlight)
- **Control Scheme:**
  - **Desktop:** Keyboard (primary) + Mouse clicks to select + Mouse drag/swipe to move
  - **Mobile:** Touch tap to select + Swipe gestures to move (up/down/left/right)
- **Files Modified:**
  - `client/assets/hammer.min.js` - Local Hammer.js library
  - `client/index.html` - Added script tag for Hammer.js
  - `client/package.json` - Added `@types/hammerjs`, removed unused `hammerjs` package
  - `client/src/game-controller.ts` - Integrated Hammer + fixed click handler + added debug logging
  - `client/css/game.css` - Touch optimization CSS
  - `doc/BUGS-FIXED.md` - Documented complete fix
  - `doc/BUGS.md` - Bug #9 removed (was already removed on 2025-10-12)

**Status:** ✅ Complete. Mobile swipe gestures verified working. Desktop clicks fixed (awaiting final user confirmation). Debug logging still active for verification.

---

### Bug Fix: Host Controls "undefined/17" Display ✅ FIXED (October 12, 2025)

**Bug Resolved:**
- **Issue:** Host dashboard showed "undefined/17" for goals instead of "0/17"
- **Root Cause:** Property path mismatch - API returns `data.progress.goalsCompleted` and `data.statistics.uniquePlayers`, but client was reading `data.goalsCompleted` and `data.statistics.totalPlayers`
- **Fix:** Updated `displayStats()` in `client/src/host-manager.ts` to use correct property paths
- **Changes:**
  - Goals: Read from `data.progress.goalsCompleted` (not `data.goalsCompleted`)
  - Players: Read from `data.statistics.uniquePlayers` (not `data.statistics.totalPlayers`)
  - Added null/undefined checks with fallback to 0
- **Files Modified:**
  - `client/src/host-manager.ts` - Updated displayStats() method
  - `doc/BUGS.md` - Moved Bug #3 to doc/BUGS-FIXED.md
  - `doc/BUGS-FIXED.md` - New file created for fixed bugs archive

**Status:** Ready for E2E testing. Dashboard should now show "0/17" at start.

---

### Bug Fix: Extend Round 404 Error ✅ FIXED (October 12, 2025)

**Critical Bug Resolved:**
- **Issue:** Clicking "Extend Deadline" button returned 404 error
- **Root Cause:** HTTP method mismatch (client sent PUT, server expected POST)
- **Fix:** Changed `client/src/api-client.ts` extendRound method from PUT to POST
- **Rationale:** Maintains consistency with other host endpoints (all use POST)
- **Files Modified:**
  - `client/src/api-client.ts` - Changed HTTP method
  - `doc/api-specification.md` - Updated documentation
  - `doc/BUGS.md` - Moved Bug #1 to doc/BUGS-FIXED.md

**Status:** Ready for E2E testing. Host functionality now fully operational.

---

### Documentation Organization Improvement ✅ COMPLETE (October 12, 2025)

**Improvement Made:**
- Created `doc/BUGS-FIXED.md` to archive all resolved bugs
- Updated `doc/BUGS.md` to only track active/open bugs
- Added note in BUGS.md directing readers to BUGS-FIXED.md for resolved issues
- Cleaner organization: active bugs stay focused, historical fixes preserved

**Files Created/Modified:**
- `doc/BUGS-FIXED.md` - New archive file with 5 fixed bugs (#1, #2, #3, #4, #7)
- `doc/BUGS.md` - Cleaned up to show only 7 active bugs

### Phase 4: Frontend UI Implementation - CSS Polish Complete (85% Complete)

**Frontend Infrastructure Complete:**
- ✅ TypeScript project structure in `/client` folder
- ✅ Build configuration (tsconfig.json, package.json, webpack)
- ✅ Shared code integration (lib-shared/ copied from /shared)
- ✅ Azure Static Web App configuration (staticwebapp.config.json)

**Core Modules Implemented:**
1. **API Client (`api-client.ts`)** ✅
   - Complete wrapper for all backend endpoints
   - Error handling with retries
   - Type-safe request/response interfaces
   - CORS-enabled communication

2. **Game Renderer (`game-renderer.ts`)** ✅
   - HTML5 Canvas rendering for 16×16 grid
   - Wall visualization (horizontal/vertical segments)
   - Robot rendering with color coding
   - Goal markers with active highlighting
   - Smooth animation support (ready for move playback)

3. **Game Controller (`game-controller.ts`)** ✅
   - Keyboard controls (arrow keys for movement, R/Y/G/B for robot selection)
   - Mouse controls (click to select robots)
   - Local puzzle solving with move history
   - Undo/reset functionality
   - Solution validation before submission
   - Integration with shared game engine

4. **Player App (`player-app.ts`)** ✅
   - Main application controller
   - Polling architecture (20-second intervals)
   - Game state management
   - Round detection and UI updates
   - Leaderboard display with live updates
   - LocalStorage for player name persistence
   - Round timer countdown

5. **HTML Structure (`index.html`)** ✅
   - Complete player UI layout
   - Game board canvas container
   - Robot selector controls
   - Move history display
   - Solution submission interface
   - Leaderboard table
   - Round status indicators

6. **CSS Foundation** ✅ (Partial)
   - Base styles (shared.css)
   - Game UI styles (game.css) - partial implementation
   - Host panel styles (host.css) - structure only

**Critical Bug Fixes in Phase 4:**

1. **CORS Configuration** ✅
   - Issue: API calls blocked by CORS policy from browser
   - Solution: Added CORS headers in `api/host.json`
   - Configuration: `"allowedOrigins": ["*"]` for development
   - Status: Complete - API accessible from client

2. **Active Round Detection** ✅
   - Issue: `getCurrentRound` not detecting active rounds correctly
   - Solution: Fixed `hasActiveRound` logic in API endpoint
   - Added proper status field checking
   - Status: Complete - rounds detected correctly

3. **Round ID Validation Standardization** ✅
   - Issue: Validation regex accepted two different formats
   - Old: Allowed both `{gameId}_round{number}` and `{gameId}_{roundNumber}`
   - Solution: Standardized to ONLY `{gameId}_round{number}`
   - Files Updated:
     - `api/shared/validation.ts` - Updated regex pattern
     - `doc/api-specification.md` - All 15+ examples updated
   - Implementation Verified: API already generates correct format
   - Status: Complete - full consistency achieved

4. **Empty Leaderboard Handling** ✅
   - Issue: Leaderboard endpoint didn't handle "no solutions" case
   - Solution: Return empty array with appropriate message
   - Status: Complete - graceful empty state display

**Remaining Phase 4 Tasks:**
- [ ] Complete CSS styling (game.css, host.css fully polished)
- [ ] Mobile responsive testing
- [ ] Cross-browser testing
- [ ] Animation polish
- [ ] End-to-end gameplay testing

**CSS Polish & UX Enhancements:** ✅ COMPLETE (October 11-12, 2025)

1. **Keyboard Accessibility (WCAG 2.1 Compliance)** ✅
   - Added `:focus-visible` styles for all interactive elements
   - 3px blue outline with 2px offset for clear visibility
   - Semi-transparent shadow for extra prominence
   - Only appears when navigating via keyboard (Tab key)
   - File: `client/css/shared.css`

2. **Dynamic Canvas Cursor** ✅
   - Default cursor on game board normally
   - Pointer cursor when hovering over robots (indicates clickable)
   - Implementation:
     - Added `getRobotAtPoint()` method to renderer (distance-based detection)
     - Mousemove listener in controller updates cursor dynamically
   - Files: `client/css/game.css`, `client/src/game-renderer.ts`, `client/src/game-controller.ts`

3. **Smooth State Transitions** ✅
   - Main content fade (0.3s opacity transition) during polling updates
   - Leaderboard row fade-in animation when new solutions appear
   - Enhanced canvas shadow on hover
   - File: `client/css/game.css`

4. **Future Enhancements Documented** ✅
   - Created `doc/FUTURE-ENHANCEMENTS.md`
   - Documented loading animations as medium-priority enhancement
   - Included implementation details and benefits

**Host Panel Status:** ✅ COMPLETE
- Host controls are integrated into index.html (not separate page)
- Host manager (host-manager.ts) fully implemented with:
  - Dashboard stats display
  - Start/end/extend round functionality
  - Share link generation with copy-to-clipboard
  - Full API integration
- Game creation modal and workflow (create-game.ts) complete

### Phase 3: Backend API Implementation ✅ COMPLETE (October 7, 2025)

**All 9 Azure Functions Operational:**
- ✅ All HTTP endpoints implemented and tested
- ✅ Timer function configured for automatic round endings
- ✅ Azure Table Storage integration working
- ✅ Complete solution validation using game engine
- ✅ Host authentication system operational
- ✅ Comprehensive error handling and validation

**Testing Infrastructure:**
- ✅ Manual test suite (22 scenarios in manual-api-tests.http)
- ✅ Automated API integration tests (3/3 passing)
- ✅ Complete test coverage: **224 total tests** (207 unit + 14 game integration + 3 API integration)

**Critical Bug Fixes:**
1. ✅ Import path issues - Fixed TypeScript build configuration
2. ✅ Storage table creation - Added ensureTable() calls
3. ✅ Azure Functions v4 configuration - Corrected package.json
4. ✅ API test authentication - Fixed helper methods

## What Needs to Be Done Next

### Immediate Next Steps (Phase 4 Completion)

1. **Debug Player App Refresh Issue** 🔍
   - Investigate polling logic in player-app.ts
   - Check network tab for API call frequency
   - Verify round state comparison logic
   - Test manual refresh vs automatic polling

2. **Complete CSS Styling** 🎨
   - Finish game.css with all game board styles
   - Polish robot selector UI
   - Style leaderboard table
   - Add responsive breakpoints
   - Implement loading states and transitions

3. **Build Host Panel** 👨‍💼
   ```
   Tasks:
   - Create host.html structure
   - Implement host-panel.ts logic
   - Build dashboard with statistics
   - Add round management controls
   - Create deadline extension UI
   - Display round history
   ```

4. **Testing & Polish** ✅
   - End-to-end gameplay testing
   - Mobile device testing
   - Cross-browser compatibility
   - Performance optimization
   - Accessibility review

### Next Phase (Phase 5: Polish & Testing)

1. **Error Handling Improvements**
   - Graceful error messages
   - Offline mode handling
   - Network retry logic

2. **UX Enhancements**
   - Smooth animations
   - Visual feedback on actions
   - Help/tutorial overlay
   - Keyboard shortcuts guide

3. **Performance**
   - Canvas rendering optimization
   - Bundle size reduction
   - Lazy loading strategies

4. **Documentation**
   - User guide
   - Host manual
   - Deployment guide

## Implementation Highlights

### Frontend Architecture
- **Framework:** Vanilla TypeScript (no dependencies)
- **Rendering:** HTML5 Canvas (16×16 grid)
- **State Management:** Polling-based with local state
- **Styling:** Custom CSS (mobile-first responsive)
- **Build:** Webpack with TypeScript loader

### Key Features Implemented
1. **Real-time-ish Updates** - 20-second polling for round changes
2. **Local Puzzle Solving** - Full game engine in browser
3. **Move Validation** - Client-side validation before submission
4. **Persistent State** - LocalStorage for player preferences
5. **Responsive Design** - Mobile-ready layout (in progress)

### Code Organization
```
client/
├── src/
│   ├── api-client.ts        # API communication layer
│   ├── game-renderer.ts     # Canvas rendering engine
│   ├── game-controller.ts   # Game interaction logic
│   ├── player-app.ts        # Main player application
│   └── host-panel.ts        # Host dashboard (TODO)
├── lib-shared/              # Shared game engine (copied)
├── css/
│   ├── shared.css           # Base styles
│   ├── game.css             # Player UI styles
│   └── host.css             # Host panel styles
├── index.html               # Player UI
├── host.html                # Host panel (TODO)
└── staticwebapp.config.json # Azure SWA config
```

## Critical Design Refinements (October 5, 2025)

### Wall Generation (L-Shaped Walls)
- Exactly 17 L-shaped wall pieces (2 walls each forming a corner)
- Each L-shape contains one goal in its corner
- 8 outer edge walls (2 per quadrant, positioned at columns/rows 2-7)
- Total: ~42 wall segments (17 L-shapes × 2 + 8 outer edges)
- Sparse layout matching authentic Ricochet Robots

### Goal Distribution System
- 4 quadrants (8×8 each): NW, NE, SW, SE
- 4 goals per quadrant (one per robot color) = 16 single-color goals
- Exactly 1 multi-color goal (ANY robot wins) = 17 total goals
- Goals cannot be on outer boundary (rows/cols 0 or 15)

### Board Persistence & Game Lifecycle
- One board = 17 rounds maximum
- Robot positions persist between rounds (evolving difficulty)
- Skipped goals return to pool (don't count as completed)
- Game ends when `completedGoalIndices.length === 17`

## Key Architecture Decisions

### 1. Serverless with Polling
- Azure Static Web Apps (frontend hosting)
- Azure Functions (API)
- Azure Table Storage (database)
- HTTP polling every 20 seconds
- **Rationale:** Simple, reliable, perfect for async gameplay

### 2. Multi-Game System
- Each game has unique gameId and hostKey
- Host controls rounds (not automatic)
- Games isolated in separate partitions
- **Rationale:** Enables private games for friends

### 3. Vanilla TypeScript
- No framework dependencies
- HTML5 Canvas for rendering
- Small bundle size (~50KB target)
- **Rationale:** Simple, fast, maintainable

## Files to Reference

### For Current Implementation
- **doc/implementation/phase4.md** - Frontend UI implementation plan
- **client/src/player-app.ts** - Main app logic (debugging focus)
- **doc/api-specification.md** - API contracts

### For Context
- **doc/architecture.md** - System design
- **doc/user-flows.md** - UX workflows
- **memory-bank/projectbrief.md** - Project vision
- **memory-bank/progress.md** - Detailed progress tracking

## Success Criteria for Phase 4

### Completed ✅
- [x] Project structure set up correctly
- [x] TypeScript compilation working
- [x] API client communicates with backend
- [x] Canvas renders game board correctly
- [x] Game controller handles keyboard/mouse input
- [x] Player app loads and displays state
- [x] LocalStorage persists player name
- [x] Leaderboard displays and updates

### In Progress ⏳
- [ ] Polling detects round changes reliably
- [ ] Complete CSS styling applied
- [ ] Host panel fully implemented
- [ ] End-to-end testing complete
- [ ] Mobile responsive verified
- [ ] Cross-browser compatibility confirmed

## Blockers & Dependencies

### Current Blockers
1. **Player app refresh bug** - Investigating polling logic
   - Not critical for development
   - Can continue with other features

### Dependencies Met
- ✅ Node.js 18+ installed
- ✅ npm package management
- ✅ TypeScript toolchain
- ✅ Azure Functions Core Tools
- ✅ Azurite (local storage emulator)

## Time Tracking

### Completed Phases
- Phase 1 (Design): ~4 hours (October 5, 2025)
- Phase 2 (Core Engine): ~8 hours (October 6, 2025)
- Phase 3 (Backend API): ~8 hours (October 7, 2025)
- Phase 4 (Frontend) so far: ~8 hours (October 8, 2025)

### Remaining Estimate
- Phase 4 completion: ~4-6 hours
- Phase 5 (Polish): ~4-6 hours
- Phase 6 (Deployment): ~2-4 hours

**Total Remaining:** 10-16 hours

## Next Session Preparation

When resuming work, priorities are:

1. **Debug refresh issue** - Fix polling/state detection
2. **Complete CSS** - Polish game.css and host.css
3. **Build host panel** - Create host.html and host-panel.ts
4. **End-to-end testing** - Verify complete gameplay flow
5. **Mobile testing** - Responsive design verification

## Quality Metrics

### Current Status
- **Documentation:** Comprehensive ✅
- **Test Coverage:** 96.46% (game engine), API tests passing ✅
- **Code Quality:** TypeScript strict mode ✅
- **API:** Complete and operational ✅
- **Frontend:** 85% complete (core features working, polling verified) ✅

### Targets
- **Performance:** <2s page load, 60fps Canvas animations
- **Accessibility:** WCAG 2.1 AA compliance
- **Mobile:** Responsive design working on phones/tablets
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

## Important Patterns & Conventions

### Frontend Code Style
- TypeScript strict mode enabled
- ES6+ features (async/await, modules, etc.)
- Functional programming where possible
- Clear separation of concerns (rendering, logic, API)
- JSDoc comments for complex functions

### Testing Strategy
- Unit tests for game engine (Jest) ✅
- Integration tests for API (Jest) ✅
- Manual testing for UI (in progress)
- End-to-end scenarios documented

### Git Workflow
- Meaningful commit messages
- Regular commits with working code
- Feature branches for major changes

## Recent Critical Fixes (October 8-9, 2025)

### Wall Generation Bug Fixes
Several critical issues with L-shape placement were discovered during E2E testing and resolved:

**1. Goals in Fully Enclosed Tiles** ✅ FIXED
- **Issue:** Goals could be placed in unreachable 4-walled tiles
- **Fix:** Added `wouldBeFullyEnclosed()` check to detect if placing an L-shape would trap the goal
- **Implementation:** Checks if the 2 "completing" walls already exist before allowing placement
- **File:** `shared/l-shape-utils.ts`

**2. L-Shapes Forming Continuous Paths** ✅ FIXED
- **Issue:** L-shapes could connect end-to-end creating long barrier paths
- **Attempted Fix:** Complex adjacency detection (too many edge cases)
- **Final Solution:** Simple **3×3 exclusion zone** - goals can't be within 3×3 box of each other
- **Implementation:** Distance check `dx <= 1 && dy <= 1` → reject placement
- **Benefits:** Simple, reliable, no edge cases
- **File:** `shared/l-shape-utils.ts`

**3. L-Shapes Touching Static Walls** ✅ FIXED
- **Issue:** Distance check alone didn't prevent touching edge walls/center square
- **Fix:** **Hybrid approach** combining distance + adjacency checks
  - Distance check for goal-to-goal separation (3×3 exclusion)
  - Adjacency check for goal-to-static-wall separation (edge walls + center)
- **File:** `shared/l-shape-utils.ts`

**Final `canPlaceLShape()` Logic:**
```typescript
1. Direct overlap check (walls don't overlap existing L-shapes) ✅
2. 3×3 exclusion zone (goals separated from each other) ✅
3. Static wall adjacency (L-shapes don't touch edge/center) ✅
4. Enclosure check (goals aren't trapped in 4-walled tiles) ✅
```

**Test Results:**
- All 210 tests passing ✅
- Clean, maintainable code
- Simple distance-based separation between L-shapes
- Precise adjacency detection for static walls only

## Learning & Insights

### What's Working Well
- Comprehensive design prevents confusion
- TypeScript catches errors early
- Polling is simpler than WebSockets
- Shared code between client/server works great
- Canvas performance is excellent
- Memory Bank pattern maintains context
- **Hybrid validation approaches** (distance + adjacency) balance simplicity with precision

### Challenges Encountered
- CORS configuration needed for local development
- Round ID format inconsistency (now resolved)
- Live-server WebSocket not related to app logic
- Polling refresh detection needs debugging
- **Complex wall adjacency detection** (solved with simpler distance-based approach)

### Key Learnings
1. TypeScript across stack provides excellent safety
2. Azure serverless is simpler than expected
3. Canvas rendering is performant enough for our needs
4. Polling every 20s is perfectly adequate
5. Documentation upfront saves debugging time
6. User feedback on design is invaluable
7. **Simple solutions often beat complex ones** (3×3 exclusion zone vs full adjacency detection)
8. **Hybrid approaches can combine best of both worlds** (distance for L-shapes, adjacency for static walls)
