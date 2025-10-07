# Async Ricochet Robots

An asynchronous multiplayer online implementation of the classic Ricochet Robots puzzle game, built on Azure serverless architecture.

## 🎮 About

Async Ricochet Robots is a web-based puzzle game where players compete to solve robot movement puzzles using the fewest moves possible. Unlike traditional real-time games, this implementation allows players to submit their solutions anytime during a configurable time period (default: 24 hours), making it perfect for casual competition with friends across different time zones.

### Key Features

- 🌐 **Multiplayer Asynchronous Gameplay** - Compete on your own schedule
- 🎯 **Multi-Game System** - Create private games for your friend group
- 🔧 **Host Controls** - Manage rounds, extend deadlines, and control game flow
- 📊 **Live Leaderboards** - See rankings update in real-time (move counts visible, solutions hidden until round ends)
- 🎲 **Random Puzzle Generation** - Every round is a unique challenge
- 💾 **Local Practice Mode** - Test your solution before submitting
- 📱 **Responsive Design** - Play on desktop, tablet, or mobile
- ☁️ **Serverless Architecture** - Built on Azure for minimal operational overhead

## 🏗️ Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript with Canvas rendering
- **Backend**: Azure Functions (Node.js)
- **Database**: Azure Table Storage
- **Hosting**: Azure Static Web Apps
- **Communication**: HTTP polling (20-second intervals)

## 📋 Game Rules

### Objective
Move the goal robot to the goal position using the fewest moves possible.

### Mechanics
- **Grid**: 16×16 board with walls and four colored robots (Red, Yellow, Green, Blue)
- **Movement**: Robots slide in straight lines until hitting a wall, boundary, or another robot
- **Strategy**: Use non-goal robots as blockers to position the goal robot precisely
- **Scoring**: Fewest moves wins

See [doc/game-rules.md](doc/game-rules.md) for complete rules and strategies.

## 🚀 Getting Started

### For Players

1. **Receive game link** from your host (e.g., `https://app.com/?game=game_abc123`)
2. **Open the link** in your browser
3. **Enter your name** when prompted
4. **Solve the puzzle** by moving robots (click robot + arrow keys or direction buttons)
5. **Submit your solution** when you reach the goal
6. **Check the leaderboard** to see your ranking

### For Hosts

1. **Create a new game** on the homepage
2. **Save your host credentials** (Game ID and Host Key)
3. **Start a round** from your host panel
4. **Share the player link** with your friends
5. **Monitor submissions** and manage round timing
6. **End the round** manually or let it expire automatically
7. **Start new rounds** whenever you're ready

## 📁 Project Structure

```
async-ricochet-robots/
├── client/              # Frontend files
│   ├── index.html      # Player UI
│   ├── host.html       # Host panel
│   ├── style.css       # Styling
│   ├── game.js         # Canvas rendering & game logic
│   └── api-client.js   # API communication
├── api/                # Azure Functions
│   ├── getCurrentRound/
│   ├── getLeaderboard/
│   ├── submitSolution/
│   ├── createGame/
│   └── host/          # Host-only endpoints
├── shared/            # Shared game logic
│   ├── game-engine.js      # Core movement & validation
│   ├── puzzle-generator.js # Random puzzle creation
│   └── constants.js        # Shared constants
├── doc/               # Documentation
│   ├── architecture.md     # System architecture
│   ├── api-specification.md # API documentation
│   ├── data-models.md      # Database schemas
│   ├── game-rules.md       # Game mechanics
│   └── user-flows.md       # User experience flows
├── memory-bank/       # Project context (for Cline AI)
│   ├── projectbrief.md
│   ├── activeContext.md
│   └── progress.md
└── tests/             # Unit and integration tests
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Azure account (for deployment only)

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/async-ricochet-robots.git
cd async-ricochet-robots

# Install dependencies
npm install

# Run tests
npm test

# Start local development server
npm run dev
```

### Azure Functions Local Development

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Install Azurite (local storage emulator)
npm install -g azurite

# Start Azurite
azurite

# Start Azure Functions locally
cd api
func start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

Comprehensive documentation is available in the `/doc` folder:

- **[Architecture](doc/architecture.md)** - System design and component overview
- **[API Specification](doc/api-specification.md)** - Complete REST API documentation
- **[Data Models](doc/data-models.md)** - Database schemas and query patterns
- **[Game Rules](doc/game-rules.md)** - Ricochet Robots mechanics and algorithms
- **[User Flows](doc/user-flows.md)** - Detailed UX workflows

## 🚢 Deployment

### Azure Static Web Apps (Automated)

1. Fork/clone this repository
2. Connect to Azure Static Web Apps
3. Configure GitHub Actions (auto-generated)
4. Push to main branch
5. Automatic deployment

See [Deployment Guide](doc/deployment.md) for detailed instructions.

## 🎯 Roadmap

### Phase 1: Design & Planning ✅
- [x] Architecture design
- [x] API specification
- [x] Data models
- [x] Documentation

### Phase 2: Core Engine (In Progress)
- [ ] Game engine implementation
- [ ] Puzzle generator
- [ ] Solution validator
- [ ] Unit tests

### Phase 3: Backend API
- [ ] Azure Functions setup
- [ ] Database layer
- [ ] REST endpoints
- [ ] Host authentication

### Phase 4: Frontend UI
- [ ] Canvas rendering
- [ ] Player interface
- [ ] Host panel
- [ ] Polling client

### Phase 5: Polish
- [ ] Error handling
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility

### Phase 6: Launch
- [ ] Azure deployment
- [ ] User testing
- [ ] Bug fixes
- [ ] Public release

## 🤝 Contributing

This is currently a personal project, but suggestions and feedback are welcome! Please open an issue to discuss proposed changes.

## 📝 License

MIT License - feel free to use this project for learning or as a base for your own implementations.

## 🙏 Acknowledgments

- **Original Game**: Ricochet Robots by Alex Randolph
- **Publisher**: Rio Grande Games
- **Inspiration**: Classic board game design and puzzle mechanics

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

## Quick Links

- **Play Game**: [Coming Soon]
- **Create Game**: [Coming Soon]
- **Documentation**: [/doc](doc/)
- **API Docs**: [/doc/api-specification.md](doc/api-specification.md)

---

**Status**: 🚧 In Development (Phase 2/6)  
**Last Updated**: October 5, 2025
