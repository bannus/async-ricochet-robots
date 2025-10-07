# Active Context: Async Ricochet Robots

## Current Status

**Phase:** Phase 1 Complete - Core Game Logic ✅  
**Date:** October 6, 2025  
**Next Phase:** Phase 2 - Firebase Backend Integration

## Recent Changes (October 6, 2025)

### TypeScript Migration ✅ COMPLETE
**Rationale:** Switched from vanilla JavaScript to TypeScript for better type safety, IDE support, and maintainability.

**Changes Made:**
1. Installed TypeScript toolchain (`typescript`, `ts-jest`, `@types/jest`, `@types/node`)
2. Created `tsconfig.json` with strict mode enabled
3. Converted `shared/types.js` → `shared/types.ts` with:
   - Enums for RobotColor, Direction, GoalColor
   - Strong interfaces (Position, Move, Robots, Walls, Goal)
   - Type guards for validation functions
   - Exported type aliases for enum values
4. Converted `tests/types.test.js` → `tests/types.test.ts`
5. Updated Jest configuration for ts-jest preset
6. Updated package.json with build scripts
7. Updated documentation (README, activeContext)

**Test Results:**
- ✅ All 29 tests pass
- ✅ 100% statement coverage
- ✅ 93.1% branch coverage
- ✅ 100% function coverage
- ✅ 100% line coverage

**Benefits Realized:**
- Type safety catches errors at compile time
- Better IDE autocomplete and refactoring
- Self-documenting code with interfaces
- Native enum support (no more string arrays)
- Type guards provide runtime validation with compile-time benefits

## What We Just Completed

### Design Documentation (✅ Complete - UPDATED with Game Corrections)
1. **architecture.md** - Full system architecture with Azure serverless design
2. **api-specification.md** - Complete REST API with all endpoints documented ✅ UPDATED
3. **data-models.md** - Azure Table Storage schemas and query patterns ✅ UPDATED
4. **game-rules.md** - Ricochet Robots mechanics and puzzle generation algorithms ✅ UPDATED
5. **user-flows.md** - Detailed UX flows for hosts and players

### Memory Bank (✅ Complete)
1. **projectbrief.md** - Core project vision, requirements, and decisions
2. **activeContext.md** - This file (current work state) ✅ UPDATING

## Critical Design Refinements (October 5, 2025)

### Wall Generation Corrections
**Original (Incorrect):**
- 30-50 random walls placed anywhere
- 50% wall density
- Single walls allowed

**Corrected (Authentic to Original Game):**
- Exactly 17 L-shaped wall pieces (2 walls each forming a corner)
- Each L-shape contains one goal in its corner
- L-shaped walls CANNOT touch or overlap each other
- 8 outer edge walls (2 per quadrant on outer boundaries, positioned 2-7 cells from corner)
  - Wall positioning clarification: "2-7 cells from corner" means wall at columns/rows 2-7
- Total: ~42 wall segments (17 L-shapes × 2 + 8 outer edges)
- Sparse layout matching actual Ricochet Robots board game

### Goal Distribution System
**Structure:**
- 4 quadrants (8×8 each): NW, NE, SW, SE
- 4 goals per quadrant (one per robot color) = 16 single-color goals
- Exactly 1 multi-color goal (placed randomly in one quadrant) = 17 total goals
- Goals cannot be on outer boundary (rows/cols 0 or 15)
  - Clarification: Walls CAN touch boundary, but goal positions cannot be at boundary
- Goals placed randomly within quadrant constraints
- Each quadrant contains 4-5 goals (16 single-color distributed + 1 multi-color random)

**Multi-Color Goal Behavior:**
- ANY robot reaching the goal position wins
- Different players may use different robots for same goal
- Leaderboard tracks `winningRobot` for each solution
- No robot assignment at generation (stays flexible)
- Placement: Random quadrant, not necessarily near center

### Board Persistence & Game Lifecycle
**Key Change:** One board = 17 rounds maximum

**Lifecycle:**
1. Game creation → Generate board with walls, robots, 17 goals
2. Round creation → Select random goal from incomplete goals
3. Round completion → Update robots to final positions, mark goal completed
4. Round skip → Goal NOT marked completed, robots unchanged, goal stays available
5. Game ends → When `completedGoalIndices.length === 17`

**Robot Persistence:**
- Robots stay in their final positions after each round
- Creates evolving difficulty (early rounds simpler, later rounds more complex)
- Starting positions only used for first round

**Goal Management:**
- `completedGoalIndices`: Array of indices into `allGoals` that are done
- Skipped goals do NOT get added to completed (return to pool)
- Host can skip "too easy" goals for later when robots have moved

### Data Model Changes
**Game Entity:**
- Added `boardData` (JSON): walls, robots, allGoals, completedGoalIndices
- Board generated once, persists throughout game

**Round Entity:**
- Removed `puzzleData` (use Game.boardData instead)
- Added `goalIndex`: Index into allGoals array
- Added `goalColor`: 'red', 'yellow', 'green', 'blue', or 'multi'
- Added `robotPositions`: Snapshot of robots at round start (for replay)
- Added `status`: 'active', 'completed', or 'skipped'

**Solution Entity:**
- Added `winningRobot`: Which robot reached goal (important for multi-color)

### API Changes
**New Endpoint:**
- `POST /api/host/endRound` with `skipGoal` parameter
- Allows host to skip goals that are too easy

**Modified Behaviors:**
- `POST /api/host/startRound`: Returns 400 if all 17 goals exhausted
- Solution validation: Checks goalColor to allow multi-color flexibility
- Leaderboard: Shows `winningRobot` for each solution

## Key Decisions from Planning Session

### Architecture Decisions
1. **Serverless with Polling** (not WebSockets)
   - Azure Static Web Apps for frontend
   - Azure Functions for API
   - Azure Table Storage for database
   - HTTP polling every 20 seconds
   - **Rationale:** Simpler, more reliable, perfect for async gameplay

2. **Multi-Game System** (not single global game)
   - Each game has unique gameId and hostKey
   - Host controls rounds, not automatic
   - Games are isolated (separate partitions)
   - **Rationale:** Allows friends to run private games

3. **Vanilla JavaScript** (not React/Vue/Svelte)
   - HTML5 Canvas for rendering
   - No framework dependencies
   - ~50KB total bundle size
   - **Rationale:** Simple, fast, easy to maintain

### Game Design Decisions
1. **One Solution Per Round** (no resubmission)
   - Encourages thoughtful solving before submitting
   - Prevents spam/trial-and-error
   - Players can practice locally unlimited

2. **Move Counts Visible, Solutions Hidden**
   - Creates competitive tension
   - Prevents copying solutions
   - Solutions revealed when round ends

3. **Configurable Round Duration**
   - Host sets default (e.g., 24 hours)
   - Can override per round
   - Can extend deadline during round
   - Can end manually

## What Needs to Be Done Next

### Immediate Next Steps (Phase 2)

1. **Set Up Project Structure**
   ```
   async-ricochet-robots/
   ├── client/          # Frontend files
   ├── api/             # Azure Functions
   ├── shared/          # Shared game logic
   ├── doc/             # ✅ Complete & Updated
   ├── memory-bank/     # ✅ Complete & Updated
   └── tests/           # Unit tests
   ```

2. **Implement Game Engine** (`shared/game-engine.js`)
   - Board representation (16×16 grid)
   - Robot movement logic (slide until collision)
   - Wall collision detection
   - Robot collision detection
   - Solution validator (handles multi-color goals)
   - **Unit tests for all movement scenarios**

3. **Implement Puzzle Generator** (`shared/puzzle-generator.js`)
   - **17 L-shaped wall pieces** (one per goal)
   - **8 outer edge walls** (2 per quadrant, positioned 2-7 cells from corner)
   - **Quadrant-based goal placement** (4 per quadrant + 1 multi-color)
   - Random robot placement (avoiding goals)
   - L-shape orientation randomization
   - **NO difficulty checking or BFS** (goals guaranteed reachable by L-shape design)

4. **Write Comprehensive Tests**
   - Movement in all directions
   - Wall collisions (horizontal & vertical)
   - Robot collisions
   - Boundary collisions
   - Solution validation (valid & invalid cases)

## Important Implementation Notes

### Game Engine Requirements
- **Isomorphic JavaScript:** Same code runs on client and server
- **Pure Functions:** No side effects, easy to test
- **Immutable State:** Don't modify input objects
- **Clear Interfaces:** Well-documented function signatures

### Wall Format (Critical!)
```javascript
walls.horizontal[row] = [col1, col2, ...]  // Walls BELOW this row
walls.vertical[col] = [row1, row2, ...]    // Walls RIGHT of this column
```
This format is used throughout the system - must be consistent!

### L-Shape Wall Orientations
```javascript
// Four orientations, each forms a corner:
'NW': ┐  // Walls on top and right
'NE': ┌  // Walls on top and left
'SW': ┘  // Walls on bottom and right
'SE': └  // Walls on bottom and left
```

### Solution Format
```javascript
[
  { robot: "red", direction: "up" },
  { robot: "blue", direction: "right" },
  // ...
]
```
Each move is an object with robot and direction.

### Validation Rules
1. Robot must be valid: "red", "yellow", "green", "blue"
2. Direction must be valid: "up", "down", "left", "right"
3. Solution must reach goal position
4. **For single-color goals:** Specific robot must reach goal
5. **For multi-color goals:** ANY robot reaching goal is valid
6. Move count must match array length
7. Track `winningRobot` in validation result

## Current Challenges & Questions

### Design Challenges Resolved
1. ✅ **Backend vs P2P:** Chose simple backend (Azure Functions)
2. ✅ **WebSocket vs Polling:** Chose polling (simpler, reliable)
3. ✅ **Global admin vs Multi-game:** Chose multi-game with host keys
4. ✅ **Move count visibility:** Show counts, hide solutions until end

### Implementation Challenges Ahead
1. **L-Shape Wall Collision Detection**
   - Ensure L-shapes don't overlap with each other
   - Ensure L-shapes don't conflict with center 2×2 area
   - Validate goal positions are within L-shape corners

2. **Multi-Color Goal Validation**
   - Server must check ANY robot at goal position
   - Track which robot actually won
   - Display correctly in leaderboard

3. **Board State Management**
   - Update robot positions after round completion
   - Track completed vs skipped goals separately
   - Handle edge case: What if winning solution is invalid on replay?

4. **Canvas Rendering Performance**
   - 16×16 grid with smooth animations
   - Render all 17 goals (faded) with active one highlighted
   - Show robot position persistence across rounds
   - 60fps target

## User Feedback from Planning

User preferences captured:
- ✅ Classic 16×16 grid with random boards
- ✅ 4 robots (red, yellow, green, blue)
- ✅ One puzzle per round (all players solve same puzzle)
- ✅ Ranked by fewest moves
- ✅ Require local playthrough (verify solutions work)
- ✅ Show move counts, hide solutions until round ends
- ✅ Azure serverless (no traditional backend)
- ✅ Configurable round duration
- ✅ Host can extend deadlines and manage rounds
- ✅ No authentication (anonymous with usernames)

**Critical User Corrections (October 5, 2025):**
- ✅ L-shaped walls only (no single walls, no decorative walls)
- ✅ Sparse wall layout (~42 wall segments: 17 L-pieces + 8 outer edges)
- ✅ Outer edge walls: 2 per quadrant, positioned 2-7 cells from corner
- ✅ Goals in L-shape corners (guarantees reachability)
- ✅ 4 per quadrant + 1 multi-color = 17 total
- ✅ Multi-color goal allows ANY robot to win
- ✅ Skipped goals don't consume - they return to pool
- ✅ Game ends after 17 completions (not automatic regeneration)
- ✅ Robot positions persist between rounds

## Files to Reference

### For Implementation
- **doc/game-rules.md** - Movement logic algorithms
- **doc/data-models.md** - Data structures to use
- **doc/api-specification.md** - API contracts to implement

### For Context
- **doc/architecture.md** - Overall system design
- **doc/user-flows.md** - How users will interact
- **memory-bank/projectbrief.md** - Core vision and requirements

## Next Session Preparation

When starting next session, Cline should:
1. Read ALL memory bank files (projectbrief, activeContext, etc.)
2. Review game-rules.md for implementation details
3. Set up project structure (create folders, package.json)
4. Begin implementing game engine with TDD approach
5. Write tests first, then implement to pass tests

## Important Patterns & Conventions

### Code Style
- TypeScript with strict mode enabled
- ES6+ features (async/await, destructuring, etc.)
- Descriptive variable names
- Strong typing with interfaces and enums
- JSDoc comments for complex functions
- Prefer pure functions
- Type guards for validation (e.g., `pos is Position`)

### Testing
- Jest for unit tests
- Test-driven development
- High coverage target (>90%)
- Test edge cases (boundaries, collisions)

### Git Workflow
- Meaningful commit messages
- Feature branches (optional for solo project)
- Regular commits with working code

### Documentation
- Update doc/ as implementation progresses
- Keep Memory Bank current
- Code comments for complex logic
- README with setup instructions

## Success Indicators

We'll know we're on track when:
- ✅ Game engine passes all movement tests
- ✅ Puzzle generator creates solvable puzzles
- ✅ Solution validator correctly identifies valid/invalid solutions
- ✅ BFS solver finds optimal solutions
- ✅ Code is clean, tested, and well-documented

## Blockers & Dependencies

### Current Blockers
- None (design phase complete)

### Dependencies
- Node.js 18+ (for Azure Functions)
- npm (package management)
- Azure account (for deployment, not needed yet)
- Git (version control)

### Tools Needed
- VS Code (already available)
- Azure Functions Core Tools (install later)
- Azurite (local storage emulator, install later)

## Time Estimates

### Phase 2 (Core Engine): ~8-12 hours
- Project setup: 1 hour
- Game engine: 3-4 hours
- Puzzle generator: 2-3 hours
- BFS solver: 2-3 hours
- Tests: 2 hours

### Phase 3 (Backend): ~6-8 hours
- Azure Functions setup: 2 hours
- Storage layer: 2 hours
- API endpoints: 3-4 hours
- Host auth: 1 hour

### Phase 4 (Frontend): ~12-16 hours
- Canvas rendering: 4-5 hours
- Player UI: 4-5 hours
- Host panel: 3-4 hours
- Polling client: 1-2 hours

### Phase 5 (Polish): ~4-6 hours
- Error handling: 2 hours
- UX improvements: 2 hours
- Performance: 1-2 hours
- Documentation: 1 hour

**Total Estimate:** 30-42 hours of development time
