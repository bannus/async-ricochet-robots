# Solution Replay Feature - Implementation Plan

**Feature:** Animated Solution Replay  
**Phase:** Phase 4.5 - Post-MVP Enhancement  
**Actual Effort:** ~3 hours  
**Priority:** Medium  
**Status:** ✅ COMPLETED  
**Date Created:** October 14, 2025  
**Date Completed:** October 14, 2025

---

## Overview

Enable users to click on leaderboard entries after a round ends to watch an auto-playing animation of that solution on the main game board. This feature enhances the learning and verification aspects of the game by allowing players to see how others solved the puzzle.

---

## Requirements

### Functional Requirements

1. **Availability:** Only active after round ends (before next round starts)
2. **Trigger:** Click on any leaderboard entry to start replay
3. **Display:** Replace main game board (no modal/popup)
4. **Playback:** Auto-play with 500ms pause between moves
5. **Animation Speed:** Same as gameplay (30ms per tile movement)
6. **End Behavior:** Stay on final robot positions
7. **Multiple Submissions:** Show only the clicked submission
8. **Exit:** Button to return to current round state

### Non-Functional Requirements

1. **Performance:** Smooth 60fps animations
2. **Responsiveness:** Works on desktop and mobile
3. **Accessibility:** Keyboard navigation support
4. **Error Handling:** Graceful handling of missing/invalid data
5. **User Experience:** Clear visual feedback during replay

---

## Architecture

### Data Flow

```
Leaderboard Entry Click 
  ↓
Fetch solution data (if not already loaded via getLeaderboard)
  ↓
Load round's starting robot positions (from API)
  ↓
Enter "replay mode" (disable player controls)
  ↓
Animate each move sequentially with pauses
  ↓
Stay on final state (enable exit button)
```

### State Management

The replay state will be managed in `player-app.ts`:

```typescript
interface ReplayState {
  isReplaying: boolean;
  currentSolution: Solution | null;
  currentMoveIndex: number;
  startingPositions: Robots;
  roundData: {
    walls: Walls;
    allGoals: Goal[];
    activeGoalIndex: number;
  } | null;
}
```

---

## Implementation Steps

### Step 1: Verify API Client Returns Solution Data
**File:** `client/src/api-client.ts`  
**Estimated Time:** 15 minutes  
**Confidence:** 10/10

#### Changes Required
- Verify `getLeaderboard()` already returns `solutionData` when round is completed
- No code changes needed (API already supports this per specification)

#### Verification
```typescript
// Check response structure when round status is 'completed'
interface LeaderboardSolution {
  playerName: string;
  moveCount: number;
  winningRobot: string;
  rank: number;
  submittedAt: number;
  solutionData?: Move[]; // Present when round ended
}
```

#### Success Criteria
- ✅ Confirm API returns `solutionData` array when round is completed
- ✅ Verify move format: `{ robot: string, direction: string }`

---

### Step 2: Add Replay Overlay Methods to GameRenderer
**File:** `client/src/game-renderer.ts`  
**Estimated Time:** 45 minutes  
**Confidence:** 9/10

#### New Methods

```typescript
class GameRenderer {
  // ... existing methods ...

  /**
   * Draw replay mode overlay banner
   */
  drawReplayOverlay(playerName: string, moveCount: number): void {
    const ctx = this.ctx;
    const bannerHeight = 50;
    
    // Semi-transparent banner at top
    ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
    ctx.fillRect(0, 0, this.canvas.width, bannerHeight);
    
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Replaying: ${playerName}'s solution (${moveCount} moves)`,
      this.canvas.width / 2,
      bannerHeight / 2
    );
  }

  /**
   * Draw current move indicator
   */
  drawMoveIndicator(moveNumber: number, totalMoves: number): void {
    const ctx = this.ctx;
    const y = this.canvas.height - 30;
    
    // Progress text
    ctx.fillStyle = '#2C3E50';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Move ${moveNumber} of ${totalMoves}`,
      this.canvas.width / 2,
      y
    );
  }
}
```

#### Enhancements to Existing Methods

Update `animateMove()` to accept optional completion callback:

```typescript
async animateMove(
  robotColor: string,
  fromPos: Position,
  toPos: Position,
  puzzle: Puzzle,
  activeGoalIndex: number,
  onComplete?: () => void
): Promise<void> {
  // ... existing animation code ...
  
  if (progress >= 1) {
    if (onComplete) onComplete();
    resolve();
  }
}
```

#### Success Criteria
- ✅ Replay banner displays at top of canvas
- ✅ Move progress indicator shows at bottom
- ✅ Overlays don't interfere with board rendering
- ✅ Clean, readable text on all backgrounds

---

### Step 3: Create ReplayController Module
**File:** `client/src/replay-controller.ts` (NEW)  
**Estimated Time:** 2 hours  
**Confidence:** 8/10

#### Class Implementation

```typescript
import type { Solution, Puzzle, Robots, Move } from '../../shared/types.js';
import { moveRobot } from '../../shared/game-engine.js';
import { GameRenderer } from './game-renderer.js';

export class ReplayController {
  private isPlaying: boolean = false;
  private currentMoveIndex: number = 0;
  
  constructor(private renderer: GameRenderer) {}

  /**
   * Replay a complete solution with animations
   */
  async replaySolution(
    solution: Solution,
    puzzle: Puzzle,
    startingPositions: Robots,
    activeGoalIndex: number
  ): Promise<void> {
    this.isPlaying = true;
    this.currentMoveIndex = 0;
    
    // Clone starting positions
    let currentPositions: Robots = JSON.parse(JSON.stringify(startingPositions));
    
    // Show replay overlay
    this.renderer.drawReplayOverlay(solution.playerName, solution.moveCount);
    
    // Replay each move
    for (let i = 0; i < solution.solutionData.length && this.isPlaying; i++) {
      const move = solution.solutionData[i];
      this.currentMoveIndex = i + 1;
      
      // Calculate destination using game engine
      const previousPositions = { ...currentPositions };
      currentPositions = moveRobot(
        puzzle.walls,
        currentPositions,
        move.robot,
        move.direction
      );
      
      // Animate the move
      await this.renderer.animateMove(
        move.robot,
        previousPositions[move.robot],
        currentPositions[move.robot],
        { ...puzzle, robots: currentPositions },
        activeGoalIndex
      );
      
      // Update move indicator
      this.renderer.drawMoveIndicator(i + 1, solution.solutionData.length);
      
      // Pause between moves (500ms)
      if (i < solution.solutionData.length - 1) {
        await this.pause(500);
      }
    }
    
    // Replay complete - stay on final state
    this.isPlaying = false;
  }

  /**
   * Stop ongoing replay
   */
  stopReplay(): void {
    this.isPlaying = false;
  }

  /**
   * Pause for specified milliseconds
   */
  private pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if currently replaying
   */
  isReplaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current move index
   */
  getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }
}
```

#### Success Criteria
- ✅ Solution replays move-by-move
- ✅ Animations smooth and accurate
- ✅ 500ms pauses between moves
- ✅ Can stop replay mid-playback
- ✅ Final state preserved after completion

---

### Step 4: Integrate Replay into PlayerApp
**File:** `client/src/player-app.ts`  
**Estimated Time:** 1.5 hours  
**Confidence:** 8/10

#### State Additions

```typescript
class PlayerApp {
  // ... existing properties ...
  
  private replayController: ReplayController;
  private isInReplayMode: boolean = false;
  private replayData: {
    solution: Solution;
    startingPositions: Robots;
  } | null = null;
  
  constructor() {
    // ... existing initialization ...
    this.replayController = new ReplayController(this.renderer);
  }
}
```

#### New Methods

```typescript
/**
 * Setup click handlers for leaderboard entries
 */
private setupLeaderboardClickHandlers(): void {
  // Only enable when round has ended
  if (this.currentRound?.status !== 'completed') {
    return;
  }
  
  const leaderboardRows = document.querySelectorAll('#leaderboard-body tr');
  leaderboardRows.forEach((row, index) => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      this.handleLeaderboardClick(index);
    });
    
    // Add replay icon
    const replayIcon = document.createElement('span');
    replayIcon.className = 'replay-icon';
    replayIcon.textContent = '▶';
    row.appendChild(replayIcon);
  });
}

/**
 * Handle click on leaderboard entry
 */
private async handleLeaderboardClick(solutionIndex: number): Promise<void> {
  if (this.isInReplayMode) {
    return; // Already replaying
  }
  
  const leaderboard = await this.apiClient.getLeaderboard(
    this.gameId,
    this.currentRound!.roundId
  );
  
  if (!leaderboard.success) {
    console.error('Failed to load solution data');
    return;
  }
  
  const solution = leaderboard.data.solutions[solutionIndex];
  
  if (!solution.solutionData) {
    alert('Solution data not available');
    return;
  }
  
  await this.playReplay(solution);
}

/**
 * Play a solution replay
 */
private async playReplay(solution: Solution): Promise<void> {
  // Enter replay mode
  this.isInReplayMode = true;
  this.disablePlayerControls();
  this.showReplayControls();
  
  // Highlight selected leaderboard entry
  const rows = document.querySelectorAll('#leaderboard-body tr');
  rows.forEach((row, i) => {
    if (row.querySelector('.player-name')?.textContent === solution.playerName) {
      row.classList.add('replaying');
    }
  });
  
  try {
    // Get starting positions from round data
    const startingPositions = this.currentRound!.puzzle.robotPositions;
    
    // Play replay
    await this.replayController.replaySolution(
      solution,
      this.currentRound!.puzzle,
      startingPositions,
      this.findGoalIndex(this.currentRound!.puzzle)
    );
    
  } catch (error) {
    console.error('Replay error:', error);
    alert('Failed to replay solution');
  }
}

/**
 * Exit replay mode
 */
private exitReplayMode(): void {
  this.isInReplayMode = false;
  this.replayController.stopReplay();
  this.enablePlayerControls();
  this.hideReplayControls();
  
  // Remove highlighting
  document.querySelectorAll('#leaderboard-body tr').forEach(row => {
    row.classList.remove('replaying');
  });
  
  // Restore current round state
  if (this.currentRound && this.currentRound.hasActiveRound) {
    this.controller.loadPuzzle(this.currentRound.puzzle, this.findGoalIndex(this.currentRound.puzzle));
  }
}

/**
 * Disable player controls during replay
 */
private disablePlayerControls(): void {
  document.querySelectorAll('.robot-selector, #undo-btn, #reset-btn, #submit-btn').forEach(el => {
    (el as HTMLButtonElement).disabled = true;
  });
}

/**
 * Enable player controls after replay
 */
private enablePlayerControls(): void {
  document.querySelectorAll('.robot-selector, #undo-btn, #reset-btn').forEach(el => {
    (el as HTMLButtonElement).disabled = false;
  });
}

/**
 * Show replay control UI
 */
private showReplayControls(): void {
  document.getElementById('replay-controls')!.style.display = 'block';
}

/**
 * Hide replay control UI
 */
private hideReplayControls(): void {
  document.getElementById('replay-controls')!.style.display = 'none';
}

/**
 * Find goal index in allGoals array
 */
private findGoalIndex(puzzle: Puzzle): number {
  return puzzle.allGoals.findIndex(g =>
    g.position.x === puzzle.goalPosition.x &&
    g.position.y === puzzle.goalPosition.y
  );
}
```

#### Integration with Existing Code

Update `displayLeaderboard()` to call `setupLeaderboardClickHandlers()`:

```typescript
private displayLeaderboard(data: LeaderboardData): void {
  // ... existing rendering code ...
  
  // Setup click handlers if round ended
  if (this.currentRound?.status === 'completed') {
    this.setupLeaderboardClickHandlers();
  }
}
```

#### Success Criteria
- ✅ Leaderboard entries clickable when round ended
- ✅ Replay starts on click
- ✅ Controls disabled during replay
- ✅ Exit button returns to normal state
- ✅ State properly managed throughout

---

### Step 5: Update Leaderboard UI for Clickability
**File:** `client/index.html`  
**Estimated Time:** 45 minutes  
**Confidence:** 9/10

#### HTML Changes

Add replay controls section above game board:

```html
<!-- Replay Controls (hidden by default) -->
<div id="replay-controls" style="display: none;">
  <div class="replay-banner">
    <span id="replay-info">Replaying solution...</span>
    <button id="exit-replay-btn" class="btn-secondary">Exit Replay</button>
  </div>
</div>

<div class="goal-info">
  <!-- existing goal info -->
</div>
```

#### CSS Changes (`client/css/game.css`)

```css
/* Leaderboard clickable entries */
#leaderboard-body tr {
  cursor: default;
  transition: background-color 0.2s;
}

#leaderboard-body tr.clickable {
  cursor: pointer;
}

#leaderboard-body tr.clickable:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

#leaderboard-body tr.replaying {
  background-color: rgba(52, 152, 219, 0.2);
  border-left: 4px solid #3498DB;
}

.replay-icon {
  margin-left: auto;
  opacity: 0.5;
  font-size: 0.9em;
}

#leaderboard-body tr.clickable:hover .replay-icon {
  opacity: 1;
}

/* Replay controls */
#replay-controls {
  margin-bottom: 20px;
}

.replay-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

#replay-info {
  font-weight: bold;
  font-size: 1.1em;
}

#exit-replay-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

#exit-replay-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}
```

#### Success Criteria
- ✅ Replay controls UI present
- ✅ Leaderboard entries show hover state
- ✅ Replay icon visible on hover
- ✅ Exit button styled and functional
- ✅ Mobile-friendly layout

---

### Step 6: Add Replay Controls UI Event Handlers
**File:** `client/src/player-app.ts`  
**Estimated Time:** 30 minutes  
**Confidence:** 10/10

#### Event Listener Setup

Add to `setupEventListeners()` method:

```typescript
private setupEventListeners(): void {
  // ... existing event listeners ...
  
  // Exit replay button
  document.getElementById('exit-replay-btn')?.addEventListener('click', () => {
    this.exitReplayMode();
  });
  
  // ESC key to exit replay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && this.isInReplayMode) {
      this.exitReplayMode();
    }
  });
}
```

#### Success Criteria
- ✅ Exit button works
- ✅ ESC key exits replay
- ✅ Clean state restoration

---

### Step 7: Test Complete Replay Flow
**Estimated Time:** 1 hour  
**Confidence:** Medium

#### Test Scenarios

1. **Basic Replay:**
   - Start round, submit solution, end round
   - Click leaderboard entry
   - Verify replay plays correctly
   - Verify final state matches submission

2. **Multiple Solutions:**
   - Submit multiple solutions from different players
   - Replay each one individually
   - Verify correct solution plays for each click

3. **Multi-Color Goals:**
   - Test with multi-color goal round
   - Verify winning robot tracked correctly
   - Replay shows correct robot reaching goal

4. **Edge Cases:**
   - 1-move solution (minimum)
   - 20+ move solution (longer replay)
   - Solution with no robot movement (edge case)

5. **UI State:**
   - Controls disabled during replay
   - Exit button works mid-replay
   - Return to normal state after exit

6. **Mobile Testing:**
   - Touch events work on leaderboard
   - Replay visible on small screens
   - Exit button accessible

#### Success Criteria
- ✅ All test scenarios pass
- ✅ No console errors
- ✅ Smooth animations throughout
- ✅ State management correct
- ✅ Mobile experience good

---

### Step 8: Test Edge Cases and Mobile
**Estimated Time:** 1 hour  
**Confidence:** Medium

#### Edge Cases to Test

1. **Round Transitions:**
   - New round starts during replay
   - Verify clean state handling

2. **Network Issues:**
   - Solution data missing
   - Graceful error handling

3. **Concurrent Actions:**
   - User navigates away during replay
   - Page refresh during replay

4. **Invalid Data:**
   - Malformed solution data
   - Missing move data

#### Mobile-Specific Tests

1. Touch targets (minimum 44×44px)
2. Scroll behavior during replay
3. Orientation changes
4. Performance on low-end devices

#### Success Criteria
- ✅ All edge cases handled gracefully
- ✅ No crashes or freezes
- ✅ Clear error messages
- ✅ Mobile experience polished

---

## File Changes Summary

| File | Type | Estimated Lines | Changes |
|------|------|-----------------|---------|
| `client/src/replay-controller.ts` | **NEW** | ~150 | Full replay orchestration logic |
| `client/src/player-app.ts` | **MODIFY** | +200 | Add replay state & handlers |
| `client/src/game-renderer.ts` | **MODIFY** | +50 | Add replay UI overlays |
| `client/index.html` | **MODIFY** | +15 | Add replay controls section |
| `client/css/game.css` | **MODIFY** | +80 | Add replay-specific styles |

**Total New Code:** ~300-400 lines  
**Total Modified Code:** ~100-150 lines

---

## Technical Considerations

### Animation Timing

```
Per Move Total Time = Animation Time + Pause Time
                    = (distance × 30ms/tile) + 500ms

Example calculations:
- 1-tile move:  30ms + 500ms = 530ms
- 5-tile move: 150ms + 500ms = 650ms
- 15-tile move: 450ms + 500ms = 950ms

7-move solution (avg 5 tiles/move):
  7 × 650ms = ~4.5 seconds total
```

### State Management

```typescript
// Before replay
- currentState = current player's working solution
- moveHistory = player's current moves

// During replay
- isInReplayMode = true
- controls disabled
- board shows replayed positions

// After replay
- Restore to pre-replay state OR
- Show current round if active
```

### Error Handling

```typescript
try {
  await replayController.replaySolution(...);
} catch (error) {
  console.error('Replay failed:', error);
  alert('Failed to replay solution. Please try again.');
  this.exitReplayMode(); // Clean up state
}
```

### Performance Considerations

- Reuse existing `animateMove()` method (already optimized)
- No new canvas operations needed
- Minimal memory overhead (~1KB per solution)
- 60fps maintained through requestAnimationFrame

---

## Testing Plan

### Manual Testing Checklist

- [ ] Start round, submit solution, end round
- [ ] Click leaderboard entry → Verify replay starts
- [ ] Watch full replay → Verify final state correct
- [ ] Click exit button → Verify returns to current state
- [ ] Test with multiple submissions from same player
- [ ] Test with multi-color goal solutions
- [ ] Test on mobile (touch events)
- [ ] Test ESC key to exit
- [ ] Test during round transition
- [ ] Test with invalid/missing data

### Edge Cases Checklist

- [ ] Round just ended (no new round yet)
- [ ] New round starts during replay
- [ ] Solution with 1 move (minimum)
- [ ] Solution with 20+ moves (maximum)
- [ ] Leaderboard refresh during replay
- [ ] Network error during replay
- [ ] Page refresh during replay

---

## Future Enhancements (Out of Scope)

As documented in `doc/FUTURE-ENHANCEMENTS.md`, these features are intentionally deferred:

### Advanced Playback Controls (Future)
- ⏸️ Play/Pause button
- ⏭️ Step forward (next move)
- ⏮️ Step backward (previous move)
- ⚡ Speed adjustment slider (0.5x, 1x, 2x)
- 🔁 Loop/repeat option
- 📊 Move-by-move breakdown view

### Enhanced Visualization (Future)
- 🎨 Path highlighting
- 📍 Move trajectory indicators
- 🎯 Goal proximity visualization
- 📈 Move efficiency graph

---

## Success Criteria

### MVP Replay Feature Complete When:

✅ User can click any leaderboard entry after round ends  
✅ Replay auto-plays smoothly with 500ms pauses  
✅ Board shows starting positions, then animates solution  
✅ Final state matches solution result  
✅ Exit button returns to current round state  
✅ No visual glitches or state corruption  
✅ Works on desktop and mobile  
✅ Clear visual feedback (replay banner, progress indicator)  
✅ Proper error handling for edge cases

---

## Implementation Timeline

| Step | Task | Duration | Cumulative |
|------|------|----------|------------|
| 1 | Verify API client | 15 min | 0.25 hr |
| 2 | Renderer updates | 45 min | 1.0 hr |
| 3 | Replay controller | 2 hr | 3.0 hr |
| 4 | Player app integration | 1.5 hr | 4.5 hr |
| 5 | Leaderboard UI | 45 min | 5.25 hr |
| 6 | Event handlers | 30 min | 5.75 hr |
| 7 | Flow testing | 1 hr | 6.75 hr |
| 8 | Edge cases & mobile | 1 hr | 7.75 hr |
| **Buffer** | | | **~0.5 hr** |
| **TOTAL** | | | **~6.5-8 hr** |

---

## Implementation Summary

**Status:** ✅ COMPLETED  
**Actual Effort:** ~3 hours  
**Completion Date:** October 14, 2025

### What Was Built

All core functionality implemented successfully:

✅ **ReplayController Module** (`client/src/replay-controller.ts`)
- Orchestrates solution replay with animations
- 500ms pauses between moves
- Clean state management

✅ **PlayerApp Integration** (`client/src/player-app.ts`)
- Replay mode state management
- Leaderboard click handlers
- Control disabling during replay
- Exit functionality (button + ESC key)
- **UI Enhancement:** Player controls hidden when round ends

✅ **UI Updates** (`client/index.html`, `client/css/game.css`)
- Replay controls banner with player info
- Clickable leaderboard entries with hover effects
- Play icons (▶) on entries
- Exit replay button

✅ **Bug Fixes During Implementation**
1. Click handlers checking wrong field (`roundEnded` → `status === 'completed'`)
2. Field name mismatch (`solutionData` → `moves`)
3. ReplayController interface using wrong field name
4. Canvas overlay redundancy removed (consolidated to DOM banner)

### Key Implementation Differences from Plan

**Simplified Approach:**
- No canvas overlays needed (used DOM `#replay-info` element instead)
- GameRenderer didn't need `drawReplayOverlay()` or `drawMoveIndicator()` methods
- Cleaner separation of concerns

**Enhanced UX:**
- Player controls completely hidden when round ends (not just disabled)
- Single info banner shows: "Replaying: {player}'s solution ({X} moves)"
- No redundant progress counters during replay

### Files Modified

| File | Status | Changes |
|------|--------|---------|
| `client/src/replay-controller.ts` | ✅ NEW | Complete replay orchestration |
| `client/src/player-app.ts` | ✅ MODIFIED | Replay integration + UI control hiding |
| `client/index.html` | ✅ MODIFIED | Replay controls section |
| `client/css/game.css` | ✅ MODIFIED | Replay styles |
| `doc/api-specification.md` | ✅ UPDATED | Fixed examples to use `moves` field |

**Total New Code:** ~200 lines  
**Total Modified Code:** ~150 lines

### Testing Completed

✅ Basic replay flow  
✅ Multiple solutions  
✅ Exit with button  
✅ Exit with ESC key  
✅ UI state management  
✅ Controls hidden when round ends  
✅ Bug fixes verified  

### UX Improvements (October 16, 2025)

After initial user testing, two UX issues were identified and fixed:

**Issue #1: Exit Replay Not Resetting Robot Positions**
- **Problem:** When exiting replay, robots stayed in their final replay positions instead of returning to starting positions
- **Root Cause:** `exitReplayMode()` had conditional logic checking `status === 'active'`, but replay only works on completed rounds
- **Fix:** Removed unnecessary conditional, now always renders starting positions on exit
- **Impact:** Users see clean board reset when exiting any replay

**Issue #2: Cannot Switch Between Replays**
- **Problem:** Clicking a different leaderboard entry during replay was blocked, requiring manual "Exit Replay" click first
- **Root Cause:** `handleLeaderboardClick()` had early return when `isInReplayMode === true`
- **Fix:** Stop current replay and remove highlighting before starting new replay
- **Impact:** Users can seamlessly switch between different solutions with single clicks

Both fixes improved the replay UX significantly with minimal code changes.

---

**Document Version:** 2.1  
**Last Updated:** October 16, 2025  
**Status:** Implementation Complete + UX Improvements  
**Author:** Cline (AI Assistant)
