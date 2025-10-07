# Async Ricochet Robots - User Flows

## Overview

This document details the step-by-step user experience for both hosts and players, covering all major interactions with the system.

---

# Host Flows

## 1. Creating a New Game

### Objective
Host creates a new game instance to start playing with friends.

### Steps

1. **Visit Homepage**
   - Navigate to application homepage
   - See "Create New Game" button

2. **Click "Create New Game"**
   - Modal/page appears with game creation form

3. **Configure Game (Optional)**
   - Enter game name (e.g., "Friday Night Puzzle")
   - Set default round duration (default: 24 hours)
   - Can leave fields blank to use defaults

4. **Submit Creation**
   - Click "Create Game" button
   - Loading indicator appears

5. **Receive Game Credentials**
   - Success message displays
   - Shown:
     - Game ID
     - **Host Key** (emphasized as important to save)
     - Player link (shareable)
     - Host panel link (with key embedded)
   - Copy buttons next to each link

6. **Save Host Key**
   - Warning: "Save this host key! You'll need it to manage rounds."
   - Option to download credentials as text file
   - Option to email credentials to self

7. **Access Host Panel**
   - Click "Go to Host Panel" button
   - Or bookmark/save host panel URL for later

### Success Criteria
- Game created in database
- Host has saved credentials
- Host can access host panel

### Error Handling
- **Network Error**: "Unable to create game. Check connection and try again."
- **Server Error**: "Game creation failed. Please try again."

---

## 2. Starting a Round

### Objective
Host starts a new round with a fresh puzzle for players.

### Prerequisites
- Host has game credentials
- No round is currently active (or previous round has ended)

### Steps

1. **Access Host Panel**
   - Navigate to host panel URL
   - Automatically authenticated via URL parameters (gameId + hostKey)
   - See dashboard with game stats

2. **Review Game Status**
   - See "No Active Round" message
   - View previous round history (if any)
   - See total players who have participated

3. **Configure Round**
   - Select round duration (dropdown or custom input)
   - Options: 1 hour, 6 hours, 12 hours, 24 hours, 48 hours, custom
   - Default: Game's default duration

4. **Click "Start Round"**
   - Confirmation: "Start Round #X with Y hour duration?"
   - Click "Confirm"

5. **Round Starts**
   - Success message: "Round started successfully!"
   - Puzzle preview shown
   - Round timer starts counting down
   - Player link displayed with "Share" button

6. **Share with Players**
   - Copy player link
   - Share via messaging, email, etc.
   - QR code available for easy mobile access

### Success Criteria
- Round created with unique puzzle
- Timer countdown visible
- Player link ready to share
- Players can access puzzle

### UI Updates
- Dashboard updates to show active round
- Timer displays: "23h 59m remaining"
- Real-time solution counter: "0 solutions submitted"

---

## 3. Monitoring Round Progress

### Objective
Host tracks player participation and solutions during active round.

### Steps

1. **View Dashboard**
   - Active round section shows:
     - Round number
     - Time remaining
     - Solutions submitted count
     - Current best score (move count only, not solution)

2. **View Leaderboard**
   - Real-time updates every 20 seconds (via polling)
   - Shows:
     - Player names
     - Move counts
     - Submission times
   - Sorted by move count (ascending)

3. **Monitor Participation**
   - See list of players who submitted
   - Track submission rate over time
   - No ability to see actual solutions (fair play)

### Success Criteria
- Host can see who's participating
- Host can track best scores
- Updates are timely (within 20s)

---

## 4. Extending Round Deadline

### Objective
Host extends round deadline to give players more time.

### Prerequisites
- Round is currently active
- Host authenticated in panel

### Steps

1. **Access Active Round Section**
   - See "Extend Deadline" button

2. **Click "Extend Deadline"**
   - Modal appears with options:
     - Add 1 hour
     - Add 6 hours
     - Add 12 hours
     - Custom date/time picker

3. **Select Extension**
   - Choose option or set custom time
   - Preview shows new end time

4. **Confirm Extension**
   - Click "Confirm"
   - Loading indicator

5. **Extension Applied**
   - Success message: "Deadline extended by X hours"
   - Timer updates to show new remaining time
   - Players see updated deadline on next poll

### Success Criteria
- Deadline updated in database
- All players see new deadline
- No solutions lost

### Error Handling
- **Round Already Ended**: "Cannot extend a completed round"
- **Invalid Time**: "Extension time must be in the future"

---

## 5. Manually Ending Round

### Objective
Host ends round early (before scheduled end time).

### Prerequisites
- Round is currently active

### Steps

1. **Click "End Round Now"**
   - Warning modal appears
   - Message: "End this round now? Players can no longer submit solutions."

2. **Confirm End**
   - Click "End Round"
   - Loading indicator

3. **Round Ends**
   - Success message: "Round ended"
   - Dashboard updates to "No Active Round"
   - Solutions revealed on leaderboard
   - Final statistics shown

4. **Review Results**
   - See final leaderboard with solutions
   - View winner and all submissions
   - Option to start next round immediately

### Success Criteria
- Round marked as completed
- Solutions visible to all
- Ready for next round

---

## 6. Viewing Round History

### Objective
Host reviews past rounds and statistics.

### Steps

1. **Scroll to "Previous Rounds" Section**
   - List of completed rounds (newest first)

2. **Click Round to Expand**
   - Shows:
     - Round number and date
     - Duration
     - Solution count
     - Winner (name and move count)
     - Puzzle preview

3. **View Detailed Results**
   - Click "View Full Leaderboard"
   - See all solutions with move sequences
   - Replay solutions (animated)

### Success Criteria
- All past rounds accessible
- Complete solution history preserved

---

# Player Flows

## 1. Joining a Game

### Objective
Player joins an active game via shared link.

### Steps

1. **Receive Game Link**
   - From host via message, email, etc.
   - Format: `https://app.com/?game=game_abc123xyz`

2. **Click Link**
   - Browser opens to game page
   - Automatically loads game based on URL parameter

3. **View Game State**
   - See game name
   - See current round status:
     - **Active Round**: Puzzle displayed
     - **No Active Round**: "Waiting for host to start next round"

4. **Enter Player Name (First Time)**
   - Prompt: "Enter your name to play"
   - Input field for name (1-20 characters)
   - Saved to localStorage for future visits

### Success Criteria
- Player sees current puzzle or waiting message
- Player name saved for reuse

### Error Handling
- **Invalid Game**: "Game not found. Check your link."
- **Network Error**: "Unable to load game. Check connection."

---

## 2. Playing the Puzzle

### Objective
Player solves puzzle locally and builds solution.

### Steps

1. **View Puzzle**
   - 16×16 grid rendered on canvas
   - Four colored robots visible
   - Goal marker shown
   - Goal robot indicated (e.g., "Get Red to ⭐")

2. **Select Robot**
   - Click robot to select
   - Selected robot highlighted
   - Or use keyboard: R, Y, G, B keys

3. **Move Robot**
   - **Method 1**: Arrow keys (↑ ↓ ← →)
   - **Method 2**: Click direction buttons
   - **Method 3**: Click/drag on board
   - Robot slides until collision

4. **Watch Animation**
   - Robot slides smoothly to final position
   - Collision point clear (hits wall/robot/edge)

5. **Build Solution**
   - Each move added to move history sidebar
   - Shows: "Move 1: Red → Right"
   - Move counter updates: "7 moves"

6. **Undo/Redo Moves**
   - Undo button (or Ctrl+Z)
   - Redo button (or Ctrl+Y)
   - Reset button to start over

7. **Test Solution**
   - Play through moves to verify goal reached
   - Local validation: Green checkmark when goal reached

### Success Criteria
- Smooth, intuitive gameplay
- Clear visual feedback
- Move history accurate

---

## 3. Submitting Solution

### Objective
Player submits completed solution to server.

### Prerequisites
- Goal robot at goal position
- Player name entered

### Steps

1. **Verify Solution**
   - Goal indicator shows "✓ Goal Reached!"
   - Move count displayed: "Your solution: 7 moves"

2. **Click "Submit Solution"**
   - Button enabled only when goal reached
   - Confirmation modal (optional): "Submit 7-move solution as [Name]?"

3. **Submit to Server**
   - Loading indicator
   - Request sent to API with solution data

4. **Receive Confirmation**
   - **Success**: 
     - "Solution submitted! You used 7 moves."
     - "Current rank: #1"
     - Confetti animation (if first place)
   - **Duplicate**: 
     - "You already submitted a solution (8 moves)"
     - "Your previous solution stands"
   - **Invalid**: 
     - "Solution doesn't reach goal. Please try again."

5. **View Updated Leaderboard**
   - Player's name appears on leaderboard
   - Move count visible
   - Rank shown

### Success Criteria
- Solution validated and stored
- Player sees confirmation
- Leaderboard updated

### Error Handling
- **Round Ended**: "This round has ended. Solutions no longer accepted."
- **Already Submitted**: "You've already submitted for this round"
- **Network Error**: "Unable to submit. Check connection and try again."

---

## 4. Viewing Leaderboard

### Objective
Player checks rankings and competition.

### Steps

1. **View Leaderboard Panel**
   - Always visible on right side (desktop)
   - Or expandable panel (mobile)

2. **See Current Rankings**
   - Updates every 20 seconds
   - Shows:
     - Rank (1, 2, 3, ...)
     - Player name
     - Move count
     - Time since submission
   - **Note**: Solutions hidden until round ends

3. **Find Own Ranking**
   - Own name highlighted
   - Scroll to position if not visible

4. **Watch Updates**
   - New submissions appear
   - Rankings adjust automatically
   - Visual indicator when new solution added

### Success Criteria
- Leaderboard accurate
- Updates timely
- Own position clear

---

## 5. Waiting for Round End

### Objective
Player waits for round to complete and sees solutions.

### Steps

1. **Monitor Timer**
   - Countdown shown: "23h 15m remaining"
   - Updates every minute

2. **Continue Improving**
   - Optional: Try to find better solution
   - Note: Can't resubmit (one solution per round)
   - Can practice different approaches

3. **Round Ends**
   - Alert/notification: "Round has ended!"
   - Leaderboard updates to show solutions

4. **View Solutions**
   - Click any player's name
   - See their move sequence
   - Replay button to animate solution

5. **Compare Solutions**
   - See how others solved it
   - Learn new strategies
   - Understand optimal approaches

### Success Criteria
- Clear indication when round ends
- All solutions visible
- Can replay any solution

---

## 6. Waiting for Next Round

### Objective
Player stays engaged between rounds.

### Steps

1. **See "No Active Round" Message**
   - "Round has ended. Waiting for host to start next round."
   - Final leaderboard remains visible

2. **Review Previous Round**
   - Explore solutions
   - Practice with previous puzzle
   - Share results with friends

3. **Automatic Check for New Round**
   - Page polls every 20 seconds
   - Detects when new round starts

4. **New Round Starts**
   - Alert: "New round started!"
   - Page automatically loads new puzzle
   - Fresh board, timer resets

### Success Criteria
- Player aware of status
- Automatic transition to new round
- No manual refresh needed

---

# Common User Journeys

## Journey 1: First-Time Host

```
1. Visit homepage
2. Create new game
3. Save host credentials
4. Start first round
5. Share player link with friends
6. Watch submissions come in
7. End round manually after good participation
8. Start round 2
9. Continue hosting weekly games
```

## Journey 2: Regular Player

```
1. Receive game link from host
2. Join game, enter name
3. Solve puzzle (20 minutes)
4. Submit solution (8 moves, rank #3)
5. Check back periodically to see rankings
6. Round ends, explore other solutions
7. Wait for next round
8. New round auto-loads
9. Solve new puzzle
10. Repeat weekly
```

## Journey 3: Competitive Player

```
1. Join game
2. Solve puzzle quickly (12 moves)
3. Submit solution (rank #5)
4. Spend hours optimizing
5. Find 7-move solution
6. Frustrated: Can't resubmit
7. Learn: One submission per round
8. Wait for next round
9. Plan strategy for next time
10. Start solving before submitting
```

## Journey 4: Host Managing Extended Session

```
1. Start round (24h duration)
2. After 12h: Only 3 submissions
3. Extend deadline by 12 hours
4. Share reminder with players
5. Monitor new submissions
6. After 30h: 15 submissions
7. Manually end round
8. Review results
9. Start new round immediately
10. Shorter duration (12h) for urgency
```

---

# Mobile Experience

## Responsive Design Considerations

### Player UI (Mobile)
- **Portrait Mode**:
  - Full-width game board (top)
  - Move controls below board
  - Leaderboard in collapsible panel
  - Swipe to toggle leaderboard

- **Landscape Mode**:
  - Game board on left
  - Leaderboard on right
  - Similar to desktop layout

### Host Panel (Mobile)
- **Stack Layout**:
  - Game info at top
  - Active round status
  - Scrollable leaderboard
  - Action buttons fixed at bottom

- **Touch Interactions**:
  - Tap to confirm actions
  - Swipe to refresh leaderboard
  - Pull to see round history

---

# Accessibility Considerations

## Keyboard Navigation
- Tab through all interactive elements
- Arrow keys for robot movement
- Enter to submit
- Esc to close modals

## Screen Reader Support
- Board state announced
- Move history readable
- Leaderboard navigable
- Alerts for important events

## Visual Accessibility
- High contrast mode option
- Colorblind-friendly robot markers (shapes + colors)
- Adjustable font sizes
- Clear focus indicators

---

# Error Recovery

## Common Error Scenarios

### 1. Lost Connection During Round
**Problem**: Player loses internet mid-puzzle

**Recovery**:
1. Local state preserved in browser
2. On reconnect, page auto-reloads puzzle
3. In-progress solution saved in localStorage
4. Can continue from where left off

### 2. Submitted to Wrong Round
**Problem**: Player submits after round ended

**Response**:
- Error message: "Round has ended"
- Previous solution attempt not lost
- Can try solution in next round

### 3. Host Loses Credentials
**Problem**: Host loses host key

**Recovery**:
- No retrieval method (security)
- Host must create new game
- Old game remains accessible (read-only)
- Educate about saving credentials

### 4. Browser Crash During Gameplay
**Problem**: Browser closes unexpectedly

**Recovery**:
1. Reload page with game link
2. LocalStorage restores:
   - Player name
   - Current move sequence (if not submitted)
3. Can resume solving

---

# Performance Expectations

## Page Load Times
- Initial load: < 2 seconds
- New round load: < 1 second
- Leaderboard update: < 500ms

## Interaction Responsiveness
- Robot move animation: 300-500ms
- Submit solution: < 1 second
- Host action (start/end round): < 2 seconds

## Polling Impact
- 20-second interval
- Minimal bandwidth (~1KB per poll)
- No noticeable performance impact

---

# User Feedback Mechanisms

## Visual Feedback
- Loading spinners for async operations
- Success/error toasts
- Smooth animations for moves
- Confetti for achievements

## Audio Feedback (Optional)
- Success sound on solution submit
- Notification sound on round end
- Can be muted in settings

## Haptic Feedback (Mobile)
- Vibration on robot collision
- Vibration on successful submit
- Can be disabled in settings
