# Copilot Instructions for Async Ricochet Robots

This document provides instructions and context for GitHub Copilot when working in this repository.

## Project Overview

Async Ricochet Robots is an asynchronous multiplayer implementation of the Ricochet Robots puzzle game. Players compete to solve puzzles using the fewest moves over configurable time periods (default 24 hours).

**Live at:** https://robots.bann.us/

## Technology Stack

- **Language**: TypeScript (compiled to JavaScript)
- **Runtime**: Node.js 22.x
- **Frontend**: HTML5 Canvas (no framework) with TypeScript
- **Backend**: Azure Functions (Node.js with TypeScript)
- **Database**: Azure Table Storage
- **Hosting**: Azure Static Web Apps
- **Testing**: Jest with ts-jest (unit/integration), Playwright (E2E)

## Project Structure

```
async-ricochet-robots/
├── shared/              # Core game logic (isomorphic TypeScript)
├── tests/               # Unit, integration, and E2E tests
│   ├── unit/            # Unit tests for shared code
│   ├── integration/     # API integration tests
│   └── e2e/             # Playwright E2E tests
├── client/              # Frontend HTML5 Canvas application
├── api/                 # Backend Azure Functions
├── doc/                 # Design documentation
├── memory-bank/         # Project context files
├── .github/             # GitHub configuration and workflows
├── tsconfig.json        # Root TypeScript configuration
├── package.json         # Root package configuration
├── jest.config.js       # Jest test configuration
└── playwright.config.ts # Playwright E2E test configuration
```

## Commands

### Building

```bash
# Build TypeScript (shared code)
npm run build

# Build in watch mode
npm run build:watch

# Type check without emitting files
npm run type-check

# Build client
cd client && npm run build

# Build API
cd api && npm run build
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests (requires Azurite)
npm run test:integration

# Run all tests including integration
npm run test:all

# Generate coverage report
npm run test:coverage

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Development

```bash
# Install all dependencies
npm install
cd client && npm install
cd api && npm install

# Run client in dev mode (watch + serve)
npm run dev:client

# Start SWA emulator (full stack)
npm run swa:start
```

## Code Style and Conventions

### TypeScript

- Use strict TypeScript with all strict mode options enabled
- Prefer type imports: `import type { Position } from './types'`
- Use enums for fixed sets of values (e.g., `RobotColor`, `Direction`, `GoalColor`)
- Export type aliases for enum values using template literal types:
  ```typescript
  type RobotColorValue = `${RobotColor}`;
  ```
- Use JSDoc comments for all exported functions with `@param`, `@returns`, and `@example` tags

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for interfaces, types, classes, and enums
- Use SCREAMING_SNAKE_CASE for constants
- Prefix boolean variables/functions with `is`, `has`, `can`, `should`

### Functions

- Keep functions small and focused on a single responsibility
- Include validation functions for type guards (e.g., `isValidPosition`, `isValidMove`)
- Provide utility functions for common operations (e.g., `cloneRobots`, `cloneWalls`)

### Testing

- Place unit tests in `tests/unit/` with `.test.ts` suffix
- Test file names should match the module being tested (e.g., `game-engine.test.ts`)
- Use descriptive test names with `describe` and `it` blocks
- Include edge cases and boundary conditions in tests

### Error Handling

- Use result objects with `success` flag for fallible operations
- Throw errors only for truly exceptional situations
- Provide descriptive error messages

## Shared Code

The `shared/` directory contains isomorphic TypeScript code used by both client and server:

- `types.ts` - Core types, enums, constants, and validation helpers
- `game-engine.ts` - Robot movement, collision detection, puzzle generation
- `solution-validator.ts` - Solution validation logic
- `wall-utils.ts` - Wall blocking detection
- `l-shape-utils.ts` - L-shaped wall generation
- `goal-placement.ts` - Goal generation algorithm
- `random-utils.ts` - Seeded random number generation

## Boundaries

### Do NOT

- Modify the Azure Static Web Apps deployment workflow without explicit request
- Add external dependencies without checking for vulnerabilities
- Store secrets or credentials in code
- Modify the core game mechanics without understanding the Ricochet Robots rules

### Be Careful With

- Changes to `shared/` code as it affects both client and server
- Changes to API endpoints as they may break client compatibility
- Changes to data models stored in Azure Table Storage

## Documentation

Key documentation files in `doc/`:

- `game-rules.md` - Game mechanics and rules
- `architecture.md` - System design and technology choices
- `api-specification.md` - REST API endpoints
- `data-models.md` - Database schemas
- `DEBUGGING.md` - Debugging guide for VS Code
