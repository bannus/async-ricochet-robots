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

🎮 **Live in Production**: https://robots.bann.us/

Production-ready multiplayer puzzle game featuring:
- Core game engine
- REST API
- Interactive Canvas UI with host panel
- Solution replay system
- Mobile touch support
- Deployed on Azure Static Web Apps

## Setup

### Prerequisites

- **Node.js** 18+ (required for Azure Functions)
- **npm** (comes with Node.js)
- **Git** (for version control)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bannus/async-ricochet-robots.git
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

**Recommended: F5 Full-Stack Debugging**

Press **F5** in VS Code to start the SWA emulator with full debugging support:
- Client + API on `http://localhost:4280`
- Set breakpoints in both client and API TypeScript files
- Auto-builds both client and API before starting

See `doc/DEBUGGING.md` for complete debugging guide.

**Alternative: Standalone Client**

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
├── shared/              # Shared game logic (TypeScript)
├── tests/               # Unit and integration tests
├── client/              # Frontend application
├── api/                 # Backend Azure Functions
├── doc/                 # Design documentation
├── memory-bank/         # Project context
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project configuration
└── README.md            # This file
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

## Contributing

This is currently a solo project for learning purposes. Feedback and suggestions are welcome via issues.

## License

MIT

## Credits

Based on the original Ricochet Robots board game by Alex Randolph, published by Rio Grande Games.
