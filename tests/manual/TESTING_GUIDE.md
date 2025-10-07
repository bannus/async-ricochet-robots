# Phase 3 API Testing Guide

## Quick Start - Manual Testing (Phase A)

### Prerequisites
✅ VS Code REST Client extension installed  
⬜ Azurite installed  
⬜ Azure Functions running locally

### Step 1: Install Azurite (if not already installed)

```bash
npm install -g azurite
```

### Step 2: Start Azurite (Terminal 1)

```bash
azurite-blob --silent --location azurite
```

Leave this running. You should see output like:
```
Azurite Blob service is starting at http://127.0.0.1:10000
Azurite Blob service is successfully listening at http://127.0.0.1:10000
```

### Step 3: Start Azure Functions (Terminal 2)

```bash
cd api
func start
```

You should see output like:
```
Functions:
    createGame: [POST] http://localhost:7071/api/createGame
    getCurrentRound: [GET] http://localhost:7071/api/getCurrentRound
    getLeaderboard: [GET] http://localhost:7071/api/getLeaderboard
    submitSolution: [POST] http://localhost:7071/api/submitSolution
    hostStartRound: [POST] http://localhost:7071/api/host/startRound
    hostEndRound: [POST] http://localhost:7071/api/host/endRound
    hostExtendRound: [PUT] http://localhost:7071/api/host/extendRound
    hostDashboard: [GET] http://localhost:7071/api/host/dashboard
    checkRoundEnd: [Timer] timer trigger (0 * * * * *)
```

### Step 4: Open Testing File

1. Open `tests/manual-api-tests.http` in VS Code
2. You should see "Send Request" links above each HTTP request section

### Step 5: Run Tests

**Follow the numbered sections in order:**

1. **Create Game** - Click "Send Request" above section 1
   - Copy `gameId` and `hostKey` from response
   - Update the `@gameId` and `@hostKey` variables at the top of the file

2. **Get Current Round** - Test section 2
   - Should show "no_active_round"

3. **Start Round 1** - Test section 3
   - Copy `roundId` from response
   - Update `@roundId` variable
   - Note the `goalPosition` and `goalColor`

4. **Continue through sections 4-22** following the checklist

### Step 6: Crafting Valid Solutions

When submitting solutions (sections 5-7, 14), you need to create moves that actually reach the goal:

**Example:**
- Goal is at position `{row: 5, col: 8}`
- Red robot starts at `{row: 2, col: 3}`
- Valid solution might be:
  ```json
  [
    {"robot": "red", "direction": "down"},  // Move to row 5
    {"robot": "red", "direction": "right"}  // Move to col 8
  ]
  ```

**Tip:** The game engine validates these, so if your solution doesn't work, you'll get a clear error message.

### Testing Checklist

Use the checklist at the bottom of `manual-api-tests.http` to track your progress.

**Critical Tests:**
- ✅ Robot positions persist between rounds (section 13)
- ✅ Skip goal returns to pool (section 15)
- ✅ Leaderboard hides solutions during active round (section 8)
- ✅ Leaderboard shows solutions after round ends (section 11)
- ✅ Multi-color goals work (any robot can win)
- ✅ Host authentication blocks unauthorized access (section 18)

---

## Automated Testing (Phase B) - Coming Next

After manual testing confirms everything works, we'll add:

### Test Files to Create
1. `tests/api/storage.test.ts` - Storage layer unit tests
2. `tests/api/validation.test.ts` - Input validation tests
3. `tests/api/integration.test.ts` - Full game lifecycle tests

### What Will Be Tested
- All CRUD operations on storage layer
- Input validation and sanitization
- Complete game flow (create → 17 rounds → completion)
- Error scenarios (invalid inputs, authentication failures)
- Edge cases (skip rounds, extend deadlines, multi-color goals)
- Multi-game isolation

### Expected Coverage
- Target: >80% code coverage for API code
- ~80-100 automated tests
- Integration tests use Azurite (same as manual testing)

---

## Troubleshooting

### Azurite Issues
**Problem:** "Failed to connect to storage"  
**Solution:** Ensure Azurite is running on default ports (10000-10002)

**Problem:** "Table not found"  
**Solution:** Tables are created automatically on first use. Try creating a game first.

### Functions Issues
**Problem:** "Cannot find module"  
**Solution:** Run `npm install` in the `api` folder

**Problem:** "Port 7071 already in use"  
**Solution:** Kill the process using that port or change the port in `local.settings.json`

### REST Client Issues
**Problem:** "Send Request" links not appearing  
**Solution:** Ensure VS Code REST Client extension is installed and enabled

**Problem:** "Connection refused"  
**Solution:** Verify Azure Functions are running and listening on port 7071

### Solution Validation Issues
**Problem:** "Solution does not reach goal"  
**Solution:** 
1. Check the goal position from section 3
2. Verify your moves actually reach that position
3. Remember robots slide until they hit a wall or another robot
4. Use the game engine logic: robots move in a direction until blocked

### Common Mistakes
- Forgetting to update `@variables` with values from responses
- Not waiting for Functions to fully start before testing
- Submitting solutions that don't account for robot sliding mechanics
- Testing host endpoints without valid `x-host-key` header

---

## Next Steps After Manual Testing

Once you've completed the manual testing checklist:

1. **Document Issues** - Note any bugs or unexpected behavior
2. **Fix Issues** - Update API code as needed
3. **Phase B** - Add automated test suite for regression protection
4. **Phase 4** - Begin frontend UI development

---

## Reference

- **API Specification:** `doc/api-specification.md`
- **Data Models:** `doc/data-models.md`
- **Game Rules:** `doc/game-rules.md`
- **Implementation Plan:** `doc/implementation/phase3.md`
