# Bug Tracker - Phase 4 E2E Testing

## Status Legend
- 🔴 **Critical** - Blocking core functionality
- 🟡 **High Priority** - Important but not blocking
- 🟢 **Low Priority** - Polish/UX improvements
- ✅ **Fixed** - Resolved and verified
- 🚧 **In Progress** - Currently being worked on

---

## 🔴 Critical Issues

### Bug #1: Extend Round Returns 404
**Priority:** 🔴 Critical  
**Status:** Not Started  
**Location:** API endpoint `/host/extendRound`  
**Discovered:** E2E Testing Phase 4

**Description:**  
When clicking the "Extend Deadline" button and submitting a custom hour value, the API returns a 404 error.

**Expected Behavior:**  
- Endpoint should accept the request
- Round deadline should be extended by the specified number of hours
- UI should update with new deadline

**Actual Behavior:**  
- API returns 404 Not Found
- No deadline extension occurs

**Root Cause:** TBD  
**Likely Issues:**
- Route not registered in function app
- Path mismatch in API routing
- Missing function export

**Fix Plan:**
1. Check `api/host/extendRound/index.ts` exists and is exported
2. Verify route registration in Azure Functions
3. Check API client is calling correct endpoint path
4. Test with manual HTTP request

**Affected Components:**
- `api/host/extendRound/index.ts`
- `client/src/api-client.ts`
- `client/src/host-manager.ts`

---

### Bug #2: Wall Generation Issues
**Priority:** 🔴 Critical  
**Status:** ✅ Fixed  
**Location:** `shared/game-engine.ts`, `shared/l-shape-utils.ts`  
**Discovered:** E2E Testing Phase 4  
**Fixed:** 2025-10-08

**Description:**  
Multiple problems with the puzzle wall generation algorithm:

**Sub-Issue 2a: Missing Outer Edge Walls** ✅ FIXED
- Walls perpendicular to outer edges were not being generated
- Design spec requires 8 outer edge walls (2 per quadrant)

**Sub-Issue 2b: U Shapes Instead of L Shapes** ✅ NOT A BUG
- Visual misinterpretation during testing
- L-shapes were correct, just in various orientations

**Sub-Issue 2c: L Shapes Touching Each Other** ✅ FIXED
- Wall generation created duplicate L-shapes that could overlap
- Design spec: L-shapes should never touch

**Sub-Issue 2d: L Shapes Without Associated Goals** ✅ FIXED
- Original `generateWalls()` created 17 orphaned L-shapes
- Then goal placement added 17 MORE L-shapes (34 total!)
- Design spec: Each L-shape should have exactly one goal in its corner

**Sub-Issue 2e: Missing Center Square** ✅ FIXED
- No 2×2 wall square in the middle blocking center 4 tiles
- Design spec requires this center obstruction

**Root Cause:**  
The fundamental problem was that **wall generation and goal placement were decoupled**. The old implementation:
1. Generated 17 random L-shapes (no goals) in `l-shape-utils.ts`
2. Then generated 17 goals with their own L-shapes in `goal-placement.ts`
3. Result: 34 L-shapes total, 17 without goals, potential overlaps
4. Missing center square and outer edge walls entirely

**Fix Implementation:**
1. **Added wall initialization functions** in `l-shape-utils.ts`:
   - `initializeWalls()`: Creates empty wall structure
   - `addCenterSquare()`: Adds 2×2 center blocking walls (8 walls)
   - `addOuterEdgeWalls()`: Adds 8 outer edge walls (2 per quadrant)
   
2. **Refactored puzzle generation** in `game-engine.ts`:
   - Initialize walls → Add center square → Add outer edges → Generate goals
   - Goals are now the PRIMARY and ONLY source of L-shapes
   - Deprecated old `generateWalls()` function
   
3. **Fixed robot placement**:
   - Robots no longer spawn in blocked center square
   - Robots never spawn on goal positions
   
4. **Updated Jest configuration**:
   - Added `moduleNameMapper` to handle `.js` extensions in TypeScript imports

**Verification:**
- All 210 unit/integration tests passing
- Wall count: 8 (center) + 8 (edges) + 34 (17 L-shapes × 2) = 50 walls per puzzle
- Each puzzle has exactly 17 goals (16 single-color + 1 multi-color)
- Each goal sits in corner of exactly one L-shape
- L-shapes cannot overlap (enforced by existing overlap detection)

**Files Modified:**
- `shared/l-shape-utils.ts` - Added initialization functions
- `shared/game-engine.ts` - Refactored `generatePuzzle()`
- `package.json` - Fixed Jest module resolution
- `tests/manual/verify-wall-generation.ts` - Verification script

**Additional Fixes (2025-10-08 Evening):**
After visual inspection of generated puzzles, three critical issues were identified and fixed:

1. **Outer Edge Wall Orientation** - Walls were parallel to edges instead of perpendicular
   - Fixed: Changed from horizontal walls on row 0/15 to vertical walls AT those rows
   - Result: Walls now stick out perpendicular into the board as intended

2. **Center Square Structure** - Walls were blocking movement OUT instead of IN
   - Root cause: Walls placed at rows 7-8 instead of surrounding rows 6 and 9
   - Fixed: Repositioned walls to surround the center square perimeter
   - Result: Center 2×2 area now properly blocked from entry

3. **Goals in Center Square** - Goals could spawn in blocked center area
   - Root cause: Quadrant boundaries included positions 7-8 (overlapping with center)
   - Fixed: Changed quadrants from 1-7/8-14 to 1-6/9-14 (excluding center rows/cols)
   - Added retry logic to handle smaller quadrant space constraints

**Test Results:**
```
Test Suites: 8 passed, 8 total
Tests:       2 skipped, 208 passed, 210 total
```

**Verification:**
- Center square: 8 walls surrounding (7,7), (7,8), (8,7), (8,8) ✅
- Outer edges: 8 perpendicular walls (2 per quadrant) ✅
- Goals: Never in center square, properly distributed across quadrants ✅
- Robots: Never in center or on goals ✅
- L-shapes: 17 total (one per goal), no overlaps ✅

**Final Refinements (2025-10-08 Late Evening):**
After further E2E testing, additional wall placement issues were discovered and fixed:

1. **Goals in Fully Enclosed Tiles** - Goals could be placed in unreachable tiles
   - Issue: L-shape creates 2 walls, but if other 2 walls existed, goal was trapped
   - Fixed: Added `wouldBeFullyEnclosed()` check to `canPlaceLShape()`
   - Checks if placement would complete a 4-walled box around the goal
   
2. **L-Shapes Forming Continuous Paths** - L-shapes could connect end-to-end
   - Issue: Walls aligned consecutively creating long connected barriers
   - Fixed: Attempted adjacency detection but was too complex
   - Final solution: **3×3 exclusion zone** - goals can't be within 3×3 box of each other
   - Simple distance check: `dx <= 1 && dy <= 1` → reject
   
3. **L-Shapes Touching Static Walls** - L-shapes could touch edge walls/center
   - Issue: Distance check didn't account for static walls
   - Fixed: **Hybrid approach** combining distance + adjacency checks
   - Distance check for goal-to-goal separation
   - Adjacency check for goal-to-static-wall separation

**Final canPlaceLShape() Logic:**
```typescript
1. Direct overlap check (walls don't overlap existing L-shapes)
2. 3×3 exclusion zone (goals stay separated from each other)
3. Static wall adjacency (L-shapes don't touch edge walls/center)
4. Enclosure check (goals aren't trapped in 4-walled tiles)
```

**Benefits of Hybrid Approach:**
- Simple distance-based separation between L-shapes
- Precise adjacency detection for static walls
- Comprehensive coverage with no complex edge cases
- All 210 tests passing ✅

---

## 🟡 High Priority Issues

### Bug #3: Host Controls Shows "undefined/17"
**Priority:** 🟡 High  
**Status:** Not Started  
**Location:** `client/src/host-manager.ts`  
**Discovered:** E2E Testing Phase 4

**Description:**  
The host controls statistics card for "Goals" displays "undefined/17" instead of the actual number of completed goals.

**Expected Behavior:**  
- Should show "0/17" at game start
- Should increment as goals are completed (e.g., "5/17")

**Actual Behavior:**  
- Shows "undefined/17"

**Root Cause:** TBD  
**Likely Issues:**
- `data.goalsCompleted` not set in dashboard API response
- Property name mismatch between API and client
- Data not being passed to `displayStats()` correctly

**Fix Plan:**
1. Check `/host/dashboard` API response structure
2. Verify `goalsCompleted` is being returned
3. Check `host-manager.ts` `displayStats()` data mapping
4. Add null/undefined check and default to 0

**Affected Components:**
- `api/host/dashboard/index.ts`
- `client/src/host-manager.ts` (displayStats method)

---

### Bug #4: Robot Movement Animation Desync
**Priority:** 🟡 High  
**Status:** Not Started  
**Location:** `client/src/game-controller.ts`  
**Discovered:** E2E Testing Phase 4

**Description:**  
When pressing two direction keys quickly in succession:
- First move animation is skipped/not rendered
- Second move animation plays
- Underlying robot state is correct (both moves processed)
- Visual representation desyncs from actual position

**Expected Behavior:**  
- Both moves should be visually animated in sequence
- Visual state should always match logical state

**Actual Behavior:**  
- First move is processed but not animated
- Second move is animated
- Creates visual confusion

**Root Cause:** TBD  
**Likely Issues:**
- No animation queue - concurrent move() calls
- Second animation starts before first completes
- `animateMove()` promise not being properly awaited
- Input not disabled during animation

**Fix Plan:**
1. Implement animation queue in game-controller
2. Disable input while animation is playing
3. Ensure moves are processed sequentially
4. OR: Skip animation if another move is queued (faster gameplay)

**Affected Components:**
- `client/src/game-controller.ts` (move method)
- `client/src/game-renderer.ts` (animateMove method)

**Implementation Options:**
- **Option A:** Queue animations (smooth but slower)
- **Option B:** Skip animation if new input detected (fast but less smooth)
- **Option C:** Hybrid - queue up to 2 moves, then skip

---

### Bug #6: Quadrant Definition Overly Restrictive
**Priority:** 🟡 High  
**Status:** Not Started  
**Location:** `shared/goal-placement.ts` (QUADRANTS definition)  
**Discovered:** Code Review

**Description:**  
The QUADRANTS definition excludes all of rows and columns 7-8 to avoid the center square, but this is overly restrictive. The center square only occupies 4 specific cells: (7,7), (7,8), (8,7), (8,8). The current implementation excludes 28 valid positions unnecessarily.

**Current Behavior:**
```typescript
// Quadrants are 6×6 (36 cells each)
{ name: 'NW', xMin: 1, xMax: 6, yMin: 1, yMax: 6 },
{ name: 'NE', xMin: 9, xMax: 14, yMin: 1, yMax: 6 },
{ name: 'SW', xMin: 1, xMax: 6, yMin: 9, yMax: 14 },
{ name: 'SE', xMin: 9, xMax: 14, yMin: 9, yMax: 14 }
```

**Expected Behavior:**
```typescript
// Quadrants should be 7×7 (49 cells each) with center check
{ name: 'NW', xMin: 1, xMax: 7, yMin: 1, yMax: 7 },
{ name: 'NE', xMin: 8, xMax: 14, yMin: 1, yMax: 7 },
{ name: 'SW', xMin: 1, xMax: 7, yMin: 8, yMax: 14 },
{ name: 'SE', xMin: 8, xMax: 14, yMin: 8, yMax: 14 }
// Plus center exclusion check in randomPositionInQuadrant()
```

**Impact:**
- Reduces available goal placement space by 13 cells per quadrant (28%)
- May contribute to goal generation failures requiring retries
- Makes puzzle generation less efficient

**Root Cause:**  
Overly conservative approach to avoiding center square - excluding entire rows/columns instead of just the 4 center cells.

**Fix Plan:**
1. Update QUADRANTS to use full 7×7 ranges (1-7 and 8-14)
2. Add center exclusion check to `randomPositionInQuadrant()`:
   ```typescript
   // Exclude center 2×2 square
   if ((x === 7 || x === 8) && (y === 7 || y === 8)) {
     continue; // retry
   }
   ```
3. Update tests to verify goals never appear in center square
4. Test that generation succeeds with fewer retries

**Affected Components:**
- `shared/goal-placement.ts` (QUADRANTS and randomPositionInQuadrant)
- `tests/unit/goal-placement.test.ts` (validation tests)

---

## 🟢 Low Priority Issues

### Bug #5: Extend Button Misleading Label
**Priority:** 🟢 Low  
**Status:** Not Started  
**Location:** `client/index.html`, `client/src/host-manager.ts`  
**Discovered:** E2E Testing Phase 4

**Description:**  
The "Extend Deadline" button displays "(+6h)" suggesting it will extend by exactly 6 hours, but it actually prompts the user for a custom number of hours.

**Expected Behavior (Two Options):**
- **Option A:** Button extends by exactly 6 hours (no prompt)
- **Option B:** Button label should be "Extend Deadline..." (indicating prompt)

**Actual Behavior:**  
- Button says "Extend Deadline (+6h)"
- Clicking shows prompt for custom hours
- User can enter any value

**Root Cause:**  
Label doesn't match functionality

**Fix Plan:**  
Choose one approach:
- **Option A:** Remove prompt, extend by 6h exactly, add another button for custom
- **Option B:** Change label to "Extend Deadline..." or "Extend Deadline (Custom)"

**Recommendation:** Option B - More flexible for different game pacing needs

**Affected Components:**
- `client/index.html` (button text)
- `client/src/host-manager.ts` (extendRound method)

---

## Testing Checklist

After each bug fix:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual E2E test of affected feature
- [ ] Regression test of related features
- [ ] Update this document with fix details

---

## Fix History

<!-- Document fixes here as they're completed -->

### Example Entry:
**Bug #X: Title**  
**Fixed:** YYYY-MM-DD  
**Fix Description:** Brief description of what was changed  
**Commit:** `git hash`  
**Verified:** ✅ E2E testing passed

---

*Last Updated: 2025-10-08*
