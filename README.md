# Async Ricochet Robots

An asynchronous multiplayer implementation of the classic Ricochet Robots puzzle game, built with a serverless Azure architecture.

## Overview

Players compete to solve puzzles using the fewest moves over extended time periods (configurable, default 24 hours). The game features:

- **Asynchronous gameplay**: Submit solutions anytime during the round
- **Multi-game system**: Independent game instances with dedicated hosts
- **Local practice**: Try solutions locally before submitting
- **Transparent competition**: Move counts visible, solutions hidden until round ends
- **Host control**: Game hosts manage rounds, deadlines, and timing

## Project Status

🔨 **In Development** - Phase 1: Core Game Engine

- ✅ Design & Documentation Complete
- 🔄 Core Game Engine (In Progress)
- ⏳ Backend API (Planned)
- ⏳ Frontend UI (Planned)
- ⏳ Deployment (Planned)

## Setup

### Prerequisites

- **Node.js** 18+ (required for Azure Functions)
- **npm** (comes with Node.js)
- **Git** (for version control)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd async-ricochet-robots
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

#### Shared Code & Tests

Build TypeScript:
```bash
npm run build
```

Build in watch mode (auto-recompile on changes):
```bash
npm run build:watch
```

Type check without emitting files:
```bash
npm run type-check
```

Run tests:
```bash
npm test
```

Run tests in watch mode (auto-rerun on file changes):
```bash
npm run test:watch
```

Generate test coverage report:
```bash
npm run test:coverage
```

#### Client Development

Run client in development mode (watch + serve):
```bash
npm run dev:client
```

Build client and serve (one-time build):
```bash
npm run start:client
```

See `client/README.md` for detailed client setup and available commands.

#### API Development

See `api/README.md` for backend development setup.

## Project Structure

```
async-ricochet-robots/
├── shared/              # Shared game logic (isomorphic - runs on client & server)
│   ├── types.ts        # Type definitions, enums, and validation
│   ├── wall-utils.ts   # Wall collision detection
│   ├── game-engine.ts  # Core movement and validation logic
│   └── puzzle-generator.ts  # Board and puzzle generation
├── tests/              # Unit tests
│   ├── types.test.ts
│   ├── wall-utils.test.ts
│   ├── game-engine.test.ts
│   └── wall-generator.test.ts
├── doc/                # Design documentation
│   ├── architecture.md
│   ├── api-specification.md
│   ├── data-models.md
│   ├── game-rules.md
│   └── user-flows.md
├── memory-bank/        # Project context for AI assistant
│   ├── projectbrief.md
│   ├── activeContext.md
│   └── progress.md
├── dist/               # Compiled JavaScript (git-ignored)
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project configuration
└── README.md          # This file
```

## Documentation

- **[Game Rules](doc/game-rules.md)** - How the game works, movement mechanics, puzzle generation
- **[Architecture](doc/architecture.md)** - System design and technology choices
- **[API Specification](doc/api-specification.md)** - REST API endpoints
- **[Data Models](doc/data-models.md)** - Database schemas
- **[User Flows](doc/user-flows.md)** - User experience workflows

## Technology Stack

- **Language**: TypeScript (compiled to JavaScript)
- **Frontend**: HTML5 Canvas (no framework)
- **Backend**: Azure Functions (Node.js with TypeScript)
- **Database**: Azure Table Storage
- **Hosting**: Azure Static Web Apps
- **Testing**: Jest with ts-jest

## Game Mechanics

### Core Concept

Ricochet Robots is a puzzle game where players move colored robots on a 16×16 grid to reach goal positions. The key mechanic: **robots slide until they hit an obstacle** (wall, another robot, or board edge).

### Key Features

- **4 Robots**: Red, Yellow, Green, Blue
- **L-Shaped Walls**: 17 wall pieces, one per goal, forming corners
- **17 Goals per Board**: 16 single-color + 1 multi-color goal
- **Board Persistence**: Robot positions carry forward between rounds
- **Multi-Color Goals**: Any robot can win

### Example Game Flow

1. **Host creates game** → Generates board with walls, robots, 17 goals
2. **Host starts round** → Selects random unused goal
3. **Players solve puzzle** → Practice locally, submit solution
4. **Round ends** → Solutions revealed, leaderboard updated, robots stay in place
5. **Repeat** → Host starts new round with next goal
6. **Game complete** → After all 17 goals solved

## Development Roadmap

### Phase 1: Core Game Engine ✅ (Current)
- [x] Project setup
- [ ] Core data structures
- [ ] Wall collision detection
- [ ] Robot movement logic
- [ ] Solution validation
- [ ] Puzzle generation

### Phase 2: Backend API ⏳
- [ ] Azure Functions setup
- [ ] Database layer
- [ ] API endpoints
- [ ] Host authentication
- [ ] Timer function

### Phase 3: Frontend UI ⏳
- [ ] Canvas rendering
- [ ] Player interface
- [ ] Host panel
- [ ] Polling client

### Phase 4: Polish & Deploy ⏳
- [ ] Error handling
- [ ] Performance optimization
- [ ] Azure deployment
- [ ] Testing with users

## Contributing

This is currently a solo project for learning purposes. Feedback and suggestions are welcome via issues.

## License

MIT

## Credits

Based on the original Ricochet Robots board game by Alex Randolph, published by Rio Grande Games.
