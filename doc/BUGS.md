# Bug Tracker - Phase 4 E2E Testing

This document tracks **active/open bugs only**. For resolved bugs, see **[BUGS-FIXED.md](BUGS-FIXED.md)**.

> **Note:** When a bug is fixed and verified, it should be moved from this file to BUGS-FIXED.md to keep this tracker focused on actionable issues.

## Status Legend
- 🔴 **Critical** - Blocking core functionality
- 🟡 **High Priority** - Important but not blocking
- 🟢 **Low Priority** - Polish/UX improvements
- 🚧 **In Progress** - Currently being worked on

---

## 🔴 Critical Issues

*No critical issues at this time.*

---

## 🟡 High Priority Issues

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

### Bug #9: No Mobile Robot Movement
**Priority:** 🟡 High  
**Status:** Not Started  
**Location:** Mobile UI - needs touch controls  
**Discovered:** User Testing

**Description:**  
There is no way to move robots on mobile devices without a keyboard. The game is currently keyboard-only, making it completely unusable on mobile devices.

**Expected Behavior:**  
- Touch-based controls for robot movement
- Options could include: directional buttons, swipe gestures, or on-screen directional pad
- Touch controls should be as intuitive as keyboard controls

**Actual Behavior:**  
- Only keyboard arrow keys work for robot movement
- No touch/tap controls available
- Mobile users cannot play the game

**Root Cause:** TBD  
**Likely Issues:**
- No mobile UI implementation
- No touch event handlers
- Game controller only listens for keyboard events

**Fix Plan:**
1. Design mobile control scheme (directional buttons recommended)
2. Add touch event handlers to game controller
3. Create mobile-responsive UI for control buttons
4. Test on various mobile devices and screen sizes
5. Consider adding swipe gesture support as enhancement

**Affected Components:**
- `client/src/game-controller.ts` (add touch event handlers)
- `client/index.html` (add mobile control UI)
- `client/css/game.css` (mobile-responsive styling)

---

### Bug #10: NPM Package Vulnerabilities
**Priority:** 🟡 High  
**Status:** Not Started  
**Location:** `package.json` (client dependencies)  
**Discovered:** npm audit

**Description:**  
NPM audit reports 6 vulnerabilities (2 moderate, 4 high) in the dependency tree.

**Vulnerability Details:**
```
braces <3.0.3
Severity: high
Uncontrolled resource consumption in braces
https://github.com/advisories/GHSA-grv7-fg5c-xmjg

Dependency chain:
- braces (vulnerable)
  └─ chokidar 1.3.0 - 2.1.8
     └─ live-server >=1.2.1
  └─ micromatch <=4.0.7
     └─ anymatch 1.2.0 - 2.0.0
        └─ readdirp 2.2.0 - 2.2.1
```

**Expected Behavior:**  
- No security vulnerabilities in dependencies
- Up-to-date packages with security patches

**Actual Behavior:**  
- 6 vulnerabilities present (2 moderate, 4 high)
- Outdated versions of braces, chokidar, micromatch, anymatch, readdirp

**Root Cause:**  
Outdated `live-server` dev dependency using vulnerable versions of its dependencies.

**Fix Plan:**
1. Run `npm audit fix --force` to update to live-server@1.2.0
   - Note: This is a breaking change, requires testing
2. Alternative: Replace live-server with a different dev server (e.g., http-server, serve)
3. Test that dev server still works after update
4. Verify no functionality broken by the update
5. Re-run `npm audit` to confirm vulnerabilities resolved

**Important Notes:**
- These are **dev dependencies only** (live-server)
- Does NOT affect production build or deployed code
- Security risk is limited to development environment
- Still worth fixing for developer security and clean audits

**Affected Components:**
- `client/package.json` (live-server dependency)
- Development workflow (local server)

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

### Bug #8: Flash Before Splash Screen
**Priority:** 🟢 Low  
**Status:** Not Started  
**Location:** `client/index.html` or page initialization  
**Discovered:** User Testing

**Description:**  
On initial page load, there is a brief flash (~1 second) where the underlying game page is visible before the "Start New Game" splash screen loads and covers it.

**Expected Behavior:**  
- Splash screen should be immediately visible on page load
- No underlying content should be visible before splash screen appears
- Smooth, professional loading experience

**Actual Behavior:**  
- Brief flash of game board/UI visible
- Splash screen loads after ~1 second delay
- Creates unprofessional first impression

**Root Cause:** TBD  
**Likely Issues:**
- Splash screen element not in initial HTML
- Splash screen created via JavaScript after page load
- CSS not properly hiding game UI on initial load
- Race condition between page render and splash display

**Fix Plan:**
1. Option A: Add splash screen to initial HTML with CSS to show by default
2. Option B: Add CSS to hide game UI until splash is dismissed
3. Option C: Use CSS loading animation/skeleton screen
4. Test various network speeds to ensure consistent behavior

**Affected Components:**
- `client/index.html` (splash screen HTML)
- `client/css/shared.css` or `client/css/game.css` (initial load styles)
- `client/src/player-app.ts` or `client/src/game-controller.ts` (initialization)

---

### Bug #11: Punycode Deprecation Warning
**Priority:** 🟢 Low  
**Status:** Not Started  
**Location:** Node.js runtime dependencies  
**Discovered:** Runtime console output

**Description:**  
Node.js deprecation warning appears during runtime:
```
(node:37164) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. 
Please use a userland alternative instead.
```

**Expected Behavior:**  
- No deprecation warnings in console
- Dependencies use modern, non-deprecated APIs

**Actual Behavior:**  
- Warning appears during runtime
- Creates console noise
- No functional impact

**Root Cause:**  
One or more dependencies are using the deprecated built-in `punycode` module instead of the userland `punycode` package.

**Fix Plan:**
1. Identify which dependency is using deprecated punycode module
   - Run with `--trace-warnings` flag to find source
2. Check if newer version of that dependency is available
3. Update dependency to version that uses userland punycode
4. If no update available, consider alternative package
5. Verify warning no longer appears

**Affected Components:**
- `package.json` or `api/package.json` (whichever has the problematic dependency)
- Various npm dependencies (TBD which specific package)

---

### Bug #12: util._extend Deprecation Warning
**Priority:** 🟢 Low  
**Status:** Not Started  
**Location:** Node.js runtime dependencies  
**Discovered:** Runtime console output

**Description:**  
Node.js deprecation warning appears during runtime:
```
(node:37164) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. 
Please use Object.assign() instead.
```

**Expected Behavior:**  
- No deprecation warnings in console
- Dependencies use modern APIs (Object.assign)

**Actual Behavior:**  
- Warning appears during runtime
- Creates console noise
- No functional impact

**Root Cause:**  
One or more dependencies are using the deprecated `util._extend` API instead of the standard `Object.assign()`.

**Fix Plan:**
1. Identify which dependency is using deprecated util._extend
   - Run with `--trace-warnings` flag to find source
2. Check if newer version of that dependency is available
3. Update dependency to version that uses Object.assign
4. If no update available, consider alternative package
5. Verify warning no longer appears

**Affected Components:**
- `package.json` or `api/package.json` (whichever has the problematic dependency)
- Various npm dependencies (TBD which specific package)

---

## Testing Checklist

After each bug fix:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual E2E test of affected feature
- [ ] Regression test of related features
- [ ] Move fixed bug from BUGS.md to BUGS-FIXED.md

---

## Next Priority

The next highest priority bug to work on is **Bug #6: Quadrant Definition Overly Restrictive** (🟡 High Priority).

For all resolved bugs, see **[BUGS-FIXED.md](BUGS-FIXED.md)**.

---

*Last Updated: 2025-10-12*
