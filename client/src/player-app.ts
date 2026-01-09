/**
 * Player Application Main Controller
 * Coordinates API calls, rendering, game controller, and UI state
 */

import { ApiClient } from './api-client.js';
import { GameRenderer } from './game-renderer.js';
import { GameController } from './game-controller.js';
import { CreateGameManager } from './create-game.js';
import { GameHistoryManager } from './game-history.js';
import { HostManager } from './host-manager.js';
import { UIStateManager } from './ui-state-manager.js';
import { TimerManager } from './timer-manager.js';
import { LeaderboardManager } from './leaderboard-manager.js';
import { ReplayModeManager } from './replay-mode-manager.js';
import { showNotification, showError, showWarning, showSuccess } from './notifications.js';
import { ThemeToggle, initializeTheme } from './theme-toggle.js';

// Declare global window property for configurable polling interval (used in E2E tests)
declare global {
  interface Window {
    __POLLING_INTERVAL_MS__?: number;
  }
}

const DEFAULT_POLLING_INTERVAL = 20000;

// Initialize theme immediately to prevent flash
initializeTheme();

export class PlayerApp {
  private apiClient!: ApiClient;
  private renderer!: GameRenderer;
  private controller!: GameController;
  private createGameManager?: CreateGameManager;
  private hostManager?: HostManager;
  private themeToggle?: ThemeToggle;
  
  // Manager instances
  private uiState!: UIStateManager;
  private timer!: TimerManager;
  private leaderboard!: LeaderboardManager;
  private replayMode!: ReplayModeManager;
  
  private gameId: string = '';
  private currentRound: any = null;
  private pollingInterval: number | null = null;
  private currentRoundStatus: string | null = null;

  /**
   * Update goal description with colored robot name
   */
  private updateGoalDescription(goalColor: string): void {
    // Validate against known robot colors
    const validColors = ['red', 'yellow', 'green', 'blue', 'multi'];
    
    if (goalColor === 'multi') {
      this.uiState.updateGoalDescription('Get ANY robot to the purple goal');
      return;
    }
    
    if (validColors.includes(goalColor)) {
      this.uiState.updateGoalDescription(goalColor, `robot-${goalColor}`);
    } else {
      // Fallback to safe default - no coloring for unknown colors
      this.uiState.updateGoalDescription(`Get robot to goal`);
    }
  }

  constructor() {
    // Initialize theme toggle
    this.themeToggle = new ThemeToggle();
    
    // Get gameId from URL parameters
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    
    // Initialize API client first
    this.apiClient = new ApiClient();
    
    // Case 1: No game ID → Show create game screen
    if (!gameId) {
      this.createGameManager = new CreateGameManager(this.apiClient);
      this.createGameManager.showCreateScreen();
      return;
    }
    
    this.gameId = gameId;
    
    // Case 2: Initialize game components with responsive cell size
    const cellSize = this.calculateCellSize();
    this.renderer = new GameRenderer('game-board', cellSize);
    this.controller = new GameController(this.renderer, this.apiClient);
    
    // Initialize managers
    this.uiState = new UIStateManager();
    this.timer = new TimerManager();
    this.leaderboard = new LeaderboardManager();
    this.replayMode = new ReplayModeManager(this.renderer, this.uiState, this.leaderboard);
    
    // Wire up leaderboard callbacks
    this.leaderboard.setClickHandler((index, solutions) => {
      this.replayMode.handleLeaderboardClick(index, solutions);
    });
    this.leaderboard.setHoverHandler((index, solutions) => {
      this.replayMode.handleLeaderboardHover(index, solutions, this.renderer);
    });
    this.leaderboard.setLeaveHandler(() => {
      this.replayMode.clearPathPreview(this.renderer);
    });
    
    // Case 3: Host mode detection (from localStorage only)
    const storedKey = localStorage.getItem(`hostKey_${this.gameId}`);
    if (storedKey) {
      this.hostManager = new HostManager(this.gameId, storedKey, this.apiClient);
    }
    
    this.init();
  }

  /**
   * Initialize the application
   */
  private async init(): Promise<void> {
    // Show main container
    const container = document.querySelector('.container') as HTMLElement;
    if (container) {
      container.style.display = 'block';
    }
    
    // Load player name from localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      const nameInput = document.getElementById('player-name') as HTMLInputElement;
      if (nameInput) {
        nameInput.value = savedName;
      }
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize host controls if host
    if (this.hostManager) {
      this.hostManager.initialize();
    }
    
    // Initial load
    await this.loadCurrentRound();
    
    // Start polling (every 20 seconds)
    this.startPolling();
  }

  /**
   * Setup UI event listeners
   */
  private setupEventListeners(): void {
    // Robot selectors
    document.querySelectorAll('.robot-selector').forEach(btn => {
      btn.addEventListener('click', () => {
        const button = btn as HTMLButtonElement;
        const robot = button.dataset.robot;
        if (robot) {
          this.controller.selectRobot(robot);
        }
      });
    });
    
    // Control buttons
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        this.controller.undo();
      });
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.controller.reset();
      });
    }
    
    // Submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.submitSolution();
      });
    }
    
    // Save player name to localStorage
    const nameInput = document.getElementById('player-name') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        localStorage.setItem('playerName', target.value);
      });
    }
    
    // Exit replay button
    const exitReplayBtn = document.getElementById('exit-replay-btn');
    if (exitReplayBtn) {
      exitReplayBtn.addEventListener('click', () => {
        this.replayMode.exit(this.renderer);
      });
    }
    
    // ESC key to exit replay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.replayMode.isActive()) {
        this.replayMode.exit(this.renderer);
      }
    });
    
    // Handle window resize for responsive canvas
    let resizeTimeout: number | null = null;
    window.addEventListener('resize', () => {
      // Debounce resize events
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        this.handleResize();
      }, 250);
    });
    
    // Handle theme changes - re-render game board with new colors
    window.addEventListener('themechange', () => {
      if (this.controller && this.currentRound) {
        this.controller.rerender();
      }
    });
  }

  /**
   * Load current round data from API
   */
  private async loadCurrentRound(): Promise<void> {
    try {
      const response = await this.apiClient.getCurrentRound(this.gameId);
      
      if (!response.success) {
        this.uiState.showError(response.error || 'Failed to load game data');
        return;
      }
      
      const data = response.data;
      
      // Check game state
      if (data.gameComplete) {
        this.uiState.showGameComplete();
        return;
      }
      
      // Show "no active round" only when there's truly no round data
      if (data.hasActiveRound === false && !data.roundId) {
        this.uiState.showNoActiveRound(data.goalsCompleted || 0, data.goalsRemaining || 17);
        return;
      }
      
      // Active or completed round exists - display it
      this.currentRound = data;
      
      // Cache the active goal index to avoid recalculating it everywhere
      this.currentRound.activeGoalIndex = data.puzzle.allGoals.findIndex((g: any) =>
        g.position.x === data.puzzle.goalPosition.x &&
        g.position.y === data.puzzle.goalPosition.y
      );
      
      // Set current round in replay manager
      this.replayMode.setCurrentRound(this.currentRound);
      
      // Track this game visit in history
      const isHost = this.hostManager !== undefined;
      GameHistoryManager.addGame(this.gameId, data.gameName || 'Ricochet Robots', isHost);
      
      this.displayActiveRound(data);
      
      // Load leaderboard
      await this.loadLeaderboard();
      
      // Load host dashboard if host
      if (this.hostManager) {
        await this.hostManager.loadDashboard();
      }
      
    } catch (error) {
      console.error('Error loading current round:', error);
      this.uiState.showError('Failed to load game: ' + (error as Error).message);
    }
  }

  /**
   * Display active round UI
   */
  private displayActiveRound(data: any): void {
    // Show active round UI
    this.uiState.showActiveRound();
    
    // Update header
    this.uiState.updateHeader(data.gameName || 'Ricochet Robots', data.roundNumber || 1);
    
    // Detect if we need to reload the puzzle:
    // - New round (different roundId)
    // - Status change (e.g., pending→active or completed→active)
    // - First load (currentRoundStatus is null)
    // This prevents resetting player's progress during polling when nothing changed
    const isNewRound = this.controller.roundId !== data.roundId;
    const isFirstLoad = this.currentRoundStatus === null;
    const statusChanged = !isFirstLoad && this.currentRoundStatus !== data.status;
    const shouldReloadPuzzle = isNewRound || statusChanged || isFirstLoad;
    
    // Update tracked status
    this.currentRoundStatus = data.status;
    
    // Handle different round statuses
    if (data.status === 'pending') {
      this.handlePendingRound(data, shouldReloadPuzzle);
    } else if (data.status === 'completed') {
      this.handleCompletedRound(data, shouldReloadPuzzle);
    } else {
      this.handleActiveRound(data, shouldReloadPuzzle);
    }
    
    // Start timer countdown
    this.timer.start(data.endTime);
  }

  /**
   * Handle pending round state
   */
  private handlePendingRound(data: any, shouldReloadPuzzle: boolean): void {
    if (this.hostManager) {
      // HOST VIEW: Show goal for preview
      this.updateGoalDescription(data.puzzle.goalColor);
      
      if (shouldReloadPuzzle) {
        // Load puzzle with goal visible for host
        this.controller.gameId = this.gameId;
        this.controller.roundId = data.roundId;
        this.controller.loadPuzzle({
          walls: data.puzzle.walls,
          robots: data.puzzle.robots,
          allGoals: data.puzzle.allGoals,
          goalPosition: data.puzzle.goalPosition,
          goalColor: data.puzzle.goalColor
        }, this.currentRound.activeGoalIndex);
      }
    } else {
      // PLAYER VIEW: Hide goal
      this.uiState.updateGoalDescription('Waiting for host...');
      
      if (shouldReloadPuzzle) {
        // Load puzzle WITHOUT goal visible for players
        this.controller.gameId = this.gameId;
        this.controller.roundId = data.roundId;
        this.controller.loadPuzzle({
          walls: data.puzzle.walls,
          robots: data.puzzle.robots,
          allGoals: data.puzzle.allGoals,
          goalPosition: data.puzzle.goalPosition,
          goalColor: data.puzzle.goalColor
        }, -1); // -1 = don't render any goal marker
      }
    }
    
    this.uiState.setPlayerControlsEnabled(false);
    this.uiState.setPlayerControlsVisible(false);
    
    // Show "Preview mode" message
    this.uiState.updateGoalStatus('⏸️ Preview Mode - Waiting for host to publish', 'info');
  }

  /**
   * Handle completed round state
   */
  private handleCompletedRound(data: any, shouldReloadPuzzle: boolean): void {
    // Update goal description
    this.updateGoalDescription(data.puzzle.goalColor);
    
    // Add class to hide goal description when round ended
    this.uiState.setRoundEnded(true);
    
    if (shouldReloadPuzzle) {
      // Load puzzle into controller with goal visible
      this.controller.gameId = this.gameId;
      this.controller.roundId = data.roundId;
      this.controller.loadPuzzle({
        walls: data.puzzle.walls,
        robots: data.puzzle.robots,
        allGoals: data.puzzle.allGoals,
        goalPosition: data.puzzle.goalPosition,
        goalColor: data.puzzle.goalColor
      }, this.currentRound.activeGoalIndex);
    }
    
    this.uiState.setPlayerControlsEnabled(false);
    this.uiState.setPlayerControlsVisible(false);
    
    // Show "Round ended" message
    this.uiState.updateGoalStatus('Round ended - Click leaderboard entries to replay solutions', 'success');
  }

  /**
   * Handle active round state
   */
  private handleActiveRound(data: any, shouldReloadPuzzle: boolean): void {
    // Update goal description
    this.updateGoalDescription(data.puzzle.goalColor);
    
    // Remove round-ended class if it was previously set
    this.uiState.setRoundEnded(false);
    
    if (shouldReloadPuzzle) {
      // Load puzzle into controller with goal visible
      this.controller.gameId = this.gameId;
      this.controller.roundId = data.roundId;
      this.controller.loadPuzzle({
        walls: data.puzzle.walls,
        robots: data.puzzle.robots,
        allGoals: data.puzzle.allGoals,
        goalPosition: data.puzzle.goalPosition,
        goalColor: data.puzzle.goalColor
      }, this.currentRound.activeGoalIndex);
    }
    
    this.uiState.setPlayerControlsEnabled(true);
    this.uiState.setPlayerControlsVisible(true);
    
    // Clear any status message
    this.uiState.clearGoalStatus();
  }

  /**
   * Load leaderboard for current round
   */
  private async loadLeaderboard(): Promise<void> {
    if (!this.currentRound) return;
    
    try {
      const response = await this.apiClient.getLeaderboard(
        this.gameId,
        this.currentRound.roundId
      );
      
      if (response.success) {
        this.leaderboard.display(response.data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }

  /**
   * Submit solution to server
   */
  private async submitSolution(): Promise<void> {
    const nameInput = document.getElementById('player-name') as HTMLInputElement;
    const playerName = nameInput?.value.trim() || '';
    
    if (!playerName) {
      showWarning('Please enter your name');
      return;
    }
    
    if (this.controller.getMoveCount() === 0) {
      showWarning('No solution to submit');
      return;
    }
    
    try {
      const result = await this.controller.submitSolution(playerName);
      
      if (result.success) {
        const data = result.data;
        const submissionNum = data.solution?.submissionNumber || data.leaderboard?.yourSubmissionCount || 1;
        const moveCount = data.solution?.moveCount || data.moveCount;
        const rank = data.solution?.rank || data.rank;
        
        showSuccess(`Solution #${submissionNum} submitted! You used ${moveCount} moves. Current rank: #${rank}. You can submit again to improve your score!`, 5000);
        
        // Reload leaderboard to show new submission
        await this.loadLeaderboard();
        
        // Reset the puzzle so player can try again
        this.controller.reset();
      } else {
        showError('Failed to submit: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      showError('Failed to submit: ' + (error as Error).message);
    }
  }

  /**
   * Start polling for updates
   */
  private startPolling(): void {
    const pollingInterval = window.__POLLING_INTERVAL_MS__ ?? DEFAULT_POLLING_INTERVAL;
    console.log(`Starting polling for game updates... (interval: ${pollingInterval}ms)`);
    this.pollingInterval = window.setInterval(async () => {
      const oldRoundId = this.currentRound?.roundId;
      console.log("Loading current round....");
      
      await this.loadCurrentRound();
      
      // Check if round changed
      if (this.currentRound && this.currentRound.roundId !== oldRoundId) {
        // New round started!
        showNotification('New round started!');
      }
    }, pollingInterval);
  }

  /**
   * Calculate appropriate cell size based on viewport width
   * Ensures the 16x16 board fits within the available width
   */
  private calculateCellSize(): number {
    // Get the game section element to determine available width
    const gameSection = document.querySelector('.game-section') as HTMLElement;
    
    // Fallback to viewport width if game section not found
    const availableWidth = gameSection 
      ? gameSection.clientWidth - 48 // Account for padding (24px * 2)
      : window.innerWidth - 48; // Account for container padding
    
    // Calculate cell size: available width / 16 cells
    // Add some margin for borders and spacing (subtract ~50px total)
    const calculatedCellSize = Math.floor((availableWidth - 50) / 16);
    
    // Clamp between reasonable min/max values
    // Min: 20px (for very small screens)
    // Max: 40px (default desktop size)
    return Math.max(20, Math.min(40, calculatedCellSize));
  }

  /**
   * Handle window resize events to keep canvas responsive
   */
  private handleResize(): void {
    if (!this.renderer || !this.currentRound) return;
    
    const newCellSize = this.calculateCellSize();
    this.renderer.resize(newCellSize);
    
    // Re-render using controller to preserve current robot positions
    if (this.controller) {
      this.controller.rerender();
    } else {
      // Fallback for cases where controller doesn't exist
      this.renderer.render(this.currentRound.puzzle, this.currentRound.activeGoalIndex);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PlayerApp();
});
