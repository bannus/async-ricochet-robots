# Project Brief: Async Ricochet Robots

## Project Overview

**Name:** Async Ricochet Robots  
**Type:** Multiplayer Online Puzzle Game  
**Platform:** Web Application (Browser-based)  
**Architecture:** Serverless (Azure Functions + Static Web Apps)

## Core Concept

An asynchronous multiplayer implementation of the classic Ricochet Robots board game where players compete to solve puzzles using the fewest moves over extended time periods (configurable, default 24 hours).

## Key Differentiators

1. **Asynchronous Gameplay**: Players submit solutions anytime during the round period
2. **Multi-Game System**: Independent game instances with dedicated hosts
3. **Local Practice**: Players can try solutions locally before submitting
4. **Transparent Competition**: Move counts visible, but actual solutions hidden until round ends
5. **Host Control**: Game hosts manage rounds, deadlines, and timing

## Target Users

### Primary Users
- **Game Hosts**: Friends/organizers who create and manage games for their group
- **Players**: Puzzle enthusiasts who enjoy logical challenges and friendly competition

### Use Cases
- Weekly puzzle nights with friends
- Office competitions
- Online puzzle communities
- Casual gaming groups

## Core Requirements

### Must Have (MVP)
1. ✅ Multi-game support with unique game IDs
2. ✅ Host authentication and game management
3. ✅ Puzzle generation (random, solvable, fair)
4. ✅ Local puzzle solving with move tracking
5. ✅ Solution submission and validation
6. ✅ Leaderboard (move counts visible, solutions hidden until round ends)
7. ✅ Configurable round duration
8. ✅ Host ability to start/end rounds and extend deadlines
9. ✅ Automatic round expiration

### Should Have
- Mobile-responsive design
- Solution replay/visualization after round ends
- Round history
- Basic statistics (player participation, best scores)

### Could Have
- Tournament mode (multi-round competitions)
- Difficulty levels for puzzles
- AI hints or solution validator
- Social sharing features
- Custom puzzle creation

### Won't Have (Out of Scope)
- Real-time multiplayer (simultaneous moves)
- User authentication system (anonymous play with usernames)
- Persistent user profiles across games
- Chat/messaging between players
- Payment/monetization

## Technical Constraints

1. **Serverless Only**: Must run on Azure serverless platform (no always-on servers)
2. **No WebSockets**: Use HTTP polling instead (simpler, more reliable)
3. **Minimal Dependencies**: Prefer vanilla JavaScript over heavy frameworks
4. **Budget-Conscious**: Target essentially free tier usage for hobby scale
5. **Simple Deployment**: GitHub → Azure Static Web Apps auto-deploy

## Success Criteria

### Technical Success
- Page loads in < 2 seconds
- 99% uptime on Azure free tier
- Supports 100+ concurrent players per game
- Zero-cost operation for <50 active games
- Smooth 60fps Canvas animations

### User Success
- Host can create and share game in < 2 minutes
- Players can join and start playing in < 30 seconds
- Solution submission in < 1 second
- Leaderboard updates within 20 seconds
- Mobile experience is usable (not just desktop)

### Business Success
- Demonstrate serverless architecture capabilities
- Create reusable game engine for other puzzle games
- Portfolio-quality codebase with comprehensive documentation
- Potential for future enhancements (tournament mode, AI)

## Project Timeline

### Phase 1: Foundation (Complete - Design Phase)
- ✅ Architecture design
- ✅ API specification
- ✅ Data models
- ✅ Game rules documentation
- ✅ User flows

### Phase 2: Core Engine (Next)
- Game engine implementation
- Puzzle generator
- Solution validator
- Unit tests

### Phase 3: Backend
- Azure Functions setup
- Database layer
- API endpoints
- Host authentication

### Phase 4: Frontend
- Canvas rendering
- Player UI
- Host panel
- Polling client

### Phase 5: Polish
- Error handling
- UX improvements
- Performance optimization
- Documentation

### Phase 6: Launch
- Azure deployment
- Testing with real users
- Bug fixes
- Iteration based on feedback

## Key Decisions Made

### Architecture
- **Serverless vs Traditional Server**: Chose serverless for cost and simplicity
- **Polling vs WebSockets**: Chose polling (20s interval) for reliability
- **Framework vs Vanilla**: Chose vanilla JS for simplicity and performance
- **Azure vs Other Cloud**: Chose Azure per user preference

### Game Design
- **Multi-Game System**: Each game is independent with own host
- **One Solution Per Round**: Players can't resubmit (encourages thoughtful solving)
- **Solutions Hidden**: Until round ends (prevents copying)
- **Move Counts Visible**: Creates competitive tension
- **Host-Controlled Rounds**: No automatic round creation

### Data Design
- **Azure Table Storage**: Cheap, simple, fast enough
- **Partition Strategy**: By gameId for isolation
- **JSON in Strings**: For complex objects (walls, solutions)
- **No User Accounts**: Anonymous play with usernames

## Risks & Mitigation

### Technical Risks
1. **Cold Starts (Azure Functions)**
   - Mitigation: Acceptable for polling-based system
   - Impact: 1-2s delay on first request

2. **Table Storage Performance**
   - Mitigation: Partition strategy isolates games
   - Impact: Minimal at expected scale

3. **Cross-Partition Queries (Timer Function)**
   - Mitigation: Runs infrequently (every 1 min)
   - Impact: Acceptable performance hit

### User Experience Risks
1. **Host Loses Credentials**
   - Mitigation: Clear warnings, download option
   - Impact: Must create new game

2. **Players Can't Resubmit**
   - Mitigation: Clear UI indication, local testing
   - Impact: Design choice, not a bug

3. **20s Polling Delay**
   - Mitigation: Acceptable for async game
   - Impact: Minimal in practice

## Out of Scope (Explicitly)

1. **Real-time Features**: No live cursors, no instant updates
2. **User Accounts**: No login, no passwords, no email
3. **Social Features**: No chat, no friend lists, no profiles
4. **Monetization**: No ads, no premium features, no payments
5. **Mobile Apps**: Web-only (responsive design sufficient)
6. **AI Opponents**: Players only (AI solver could be added later)
7. **Custom Puzzles**: Generated only (manual creation out of scope)

## Reference Materials

- Original Ricochet Robots game by Alex Randolph
- Board game published by Rio Grande Games
- Classic 16×16 grid, 4 robots, slide-until-collision mechanic
- Goal: Get specific robot to specific position in fewest moves
