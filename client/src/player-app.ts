/**
 * Player Application Main Controller
 * Coordinates API calls, rendering, game controller, and UI state
 */

import { ApiClient } from './api-client.js';
import { GameRenderer } from './game-renderer.js';
import { GameController } from './game-controller.js';
import { CreateGameManager } from './create-game.js';
import { HostManager } from './host-manager.js';
import { ReplayController } from './replay-controller.js';

export class PlayerApp {
  private apiClient!: ApiClient;
  private renderer!: GameRenderer;
  private controller!: GameController;
  private createGameManager?: CreateGameManager;
  private hostManager?: HostManager;
  private replayController!: ReplayController;
  
  private gameId: string = '';
  private currentRound: any = null;
  private pollingInterval: number | null = null;
  private isInReplayMode: boolean = false;

  constructor() {
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
    this.replayController = new ReplayController(this.renderer);
    
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
        this.exitReplayMode();
      });
    }
    
    // ESC key to exit replay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isInReplayMode) {
        this.exitReplayMode();
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
  }

  /**
   * Load current round data from API
   */
  private async loadCurrentRound(): Promise<void> {
    try {
      const response = await this.apiClient.getCurrentRound(this.gameId);
      
      if (!response.success) {
        this.showError(response.error || 'Failed to load game data');
        return;
      }
      
      const data = response.data;
      
      // Check game state
      if (data.gameComplete) {
        this.showGameComplete(data);
        return;
      }
      
      // Show "no active round" only when there's truly no round data
      if (data.hasActiveRound === false && !data.roundId) {
        this.showNoActiveRound(data);
        return;
      }
      
      // Active or completed round exists - display it
      this.currentRound = data;
      
      // Cache the active goal index to avoid recalculating it everywhere
      this.currentRound.activeGoalIndex = data.puzzle.allGoals.findIndex((g: any) =>
        g.position.x === data.puzzle.goalPosition.x &&
        g.position.y === data.puzzle.goalPosition.y
      );
      
      this.displayActiveRound(data);
      
      // Load leaderboard
      await this.loadLeaderboard();
      
      // Load host dashboard if host
      if (this.hostManager) {
        await this.hostManager.loadDashboard();
      }
      
    } catch (error) {
      console.error('Error loading current round:', error);
      this.showError('Failed to load game: ' + (error as Error).message);
    }
  }

  /**
   * Display active round UI
   */
  private displayActiveRound(data: any): void {
    // Hide message screens
    const noRoundMsg = document.getElementById('no-round-message');
    const completeMsg = document.getElementById('game-complete-message');
    const errorMsg = document.getElementById('error-message');
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    
    if (noRoundMsg) noRoundMsg.style.display = 'none';
    if (completeMsg) completeMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
    if (mainContent) mainContent.style.display = 'flex';
    
    // Update header
    const gameName = document.getElementById('game-name');
    const roundNumber = document.getElementById('round-number');
    
    if (gameName) gameName.textContent = data.gameName || 'Ricochet Robots';
    if (roundNumber) roundNumber.textContent = `Round ${data.roundNumber || 1}`;
    
    // Update goal description
    const goalDesc = document.getElementById('goal-description');
    if (goalDesc) {
      const goalText = data.puzzle.goalColor === 'multi'
        ? 'Get ANY robot to the purple goal'
        : `Get ${data.puzzle.goalColor} robot to goal`;
      goalDesc.textContent = goalText;
    }
    
    // Only load puzzle if it's a new round (or first load)
    // This prevents resetting player's progress during polling
    const isNewRound = this.controller.roundId !== data.roundId;
    
    if (isNewRound) {
      // Load puzzle into controller
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
    
    // Disable/hide controls if round has ended
    if (data.status === 'completed') {
      this.disablePlayerControls();
      this.hidePlayerControls();
      
      // Show "Round ended" message
      const goalStatus = document.getElementById('goal-status');
      if (goalStatus) {
        goalStatus.className = 'success';
        goalStatus.textContent = 'Round ended - Click leaderboard entries to replay solutions';
      }
    } else {
      // Enable and show controls for active rounds
      this.enablePlayerControls();
      this.showPlayerControls();
    }
    
    // Start timer countdown
    this.startTimer(data.endTime);
  }

  /**
   * Show no active round state
   */
  private showNoActiveRound(data: any): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    const noRoundMsg = document.getElementById('no-round-message');
    const gameStats = document.getElementById('game-stats');
    
    if (mainContent) mainContent.style.display = 'none';
    if (noRoundMsg) noRoundMsg.style.display = 'block';
    
    if (gameStats) {
      gameStats.innerHTML = `
        <p>Goals completed: ${data.goalsCompleted || 0} / 17</p>
        <p>Goals remaining: ${data.goalsRemaining || 17}</p>
      `;
    }
  }

  /**
   * Show game complete state
   */
  private showGameComplete(data: any): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    const completeMsg = document.getElementById('game-complete-message');
    
    if (mainContent) mainContent.style.display = 'none';
    if (completeMsg) completeMsg.style.display = 'block';
  }

  /**
   * Show error state
   */
  private showError(message: string): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    const noRoundMsg = document.getElementById('no-round-message');
    const completeMsg = document.getElementById('game-complete-message');
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (mainContent) mainContent.style.display = 'none';
    if (noRoundMsg) noRoundMsg.style.display = 'none';
    if (completeMsg) completeMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'block';
    if (errorText) errorText.textContent = message;
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
        this.displayLeaderboard(response.data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }

  /**
   * Display leaderboard data
   */
  private displayLeaderboard(data: any): void {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!data.solutions || data.solutions.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5">No solutions yet. Be the first!</td>';
      tbody.appendChild(row);
      return;
    }
    
    // Get saved player name for highlighting
    const savedName = localStorage.getItem('playerName');
    
    data.solutions.forEach((solution: any) => {
      const row = document.createElement('tr');
      
      // Highlight current player
      if (savedName && solution.playerName.toLowerCase() === savedName.toLowerCase()) {
        row.classList.add('current-player');
      }
      
      // Display player name with submission number if available
      const playerDisplay = solution.submissionNumber 
        ? `${this.escapeHtml(solution.playerName)} (#${solution.submissionNumber})`
        : this.escapeHtml(solution.playerName);
      
      row.innerHTML = `
        <td>${solution.rank}</td>
        <td>${playerDisplay}</td>
        <td>${solution.moveCount}</td>
        <td class="robot-${solution.winningRobot}">${solution.winningRobot}</td>
        <td>${this.formatTime(solution.submittedAt)}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    // Setup click handlers if round ended
    this.setupLeaderboardClickHandlers(data);
  }

  /**
   * Submit solution to server
   */
  private async submitSolution(): Promise<void> {
    const nameInput = document.getElementById('player-name') as HTMLInputElement;
    const playerName = nameInput?.value.trim() || '';
    
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    
    if (this.controller.getMoveCount() === 0) {
      alert('No solution to submit');
      return;
    }
    
    try {
      const result = await this.controller.submitSolution(playerName);
      
      if (result.success) {
        const data = result.data;
        const submissionNum = data.solution?.submissionNumber || data.leaderboard?.yourSubmissionCount || 1;
        const moveCount = data.solution?.moveCount || data.moveCount;
        const rank = data.solution?.rank || data.rank;
        
        alert(`Solution #${submissionNum} submitted! You used ${moveCount} moves. Current rank: #${rank}\n\nYou can submit again to improve your score!`);
        
        // Reload leaderboard to show new submission
        await this.loadLeaderboard();
        
        // Reset the puzzle so player can try again
        this.controller.reset();
      } else {
        alert('Failed to submit: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit: ' + (error as Error).message);
    }
  }

  /**
   * Start polling for updates
   */
  private startPolling(): void {
    // Poll every 20 seconds
    console.log("Starting polling for game updates...");
    this.pollingInterval = window.setInterval(async () => {
      const oldRoundId = this.currentRound?.roundId;
      console.log("Loading current round....");
      
      await this.loadCurrentRound();
      
      // Check if round changed
      if (this.currentRound && this.currentRound.roundId !== oldRoundId) {
        // New round started!
        this.showNotification('New round started!');
      }
      
      // Reload leaderboard if round is active
      if (this.currentRound && this.currentRound.hasActiveRound !== false) {
        await this.loadLeaderboard();
      }
    }, 20000);
  }

  /**
   * Start countdown timer
   */
  private startTimer(endTime: number): void {
    const timerElement = document.getElementById('time-remaining');
    if (!timerElement) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      if (remaining === 0) {
        timerElement.textContent = 'Round ended';
        return;
      }
      
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  /**
   * Format timestamp for display
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  /**
   * Show toast notification
   */
  private showNotification(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
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
    // If controller exists (not on create game screen), use it to render current state
    if (this.controller) {
      this.controller.rerender();
    } else {
      // Fallback for cases where controller doesn't exist (shouldn't happen in practice)
      this.renderer.render(this.currentRound.puzzle, this.currentRound.activeGoalIndex);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Setup click handlers for leaderboard entries (replay mode)
   */
  private setupLeaderboardClickHandlers(data: any): void {
    // Only enable when round has ended
    if (data.roundStatus !== 'completed') {
      return;
    }
    
    const leaderboardRows = document.querySelectorAll('#leaderboard-body tr');
    leaderboardRows.forEach((row, index) => {
      row.classList.add('clickable');
      row.addEventListener('click', () => {
        this.handleLeaderboardClick(index, data.solutions);
      });
      
      // Add replay icon
      const replayIcon = document.createElement('span');
      replayIcon.className = 'replay-icon';
      replayIcon.textContent = ' ▶';
      replayIcon.style.opacity = '0.5';
      replayIcon.style.marginLeft = '8px';
      const playerCell = row.querySelector('td:nth-child(2)');
      if (playerCell) {
        playerCell.appendChild(replayIcon);
      }
    });
  }

  /**
   * Handle click on leaderboard entry
   */
  private async handleLeaderboardClick(solutionIndex: number, solutions: any[]): Promise<void> {
    // If already replaying, stop current replay first
    if (this.isInReplayMode) {
      this.replayController.stopReplay();
      // Remove highlighting from all rows
      document.querySelectorAll('#leaderboard-body tr').forEach(row => {
        row.classList.remove('replaying');
      });
    }
    
    const solution = solutions[solutionIndex];
    
    if (!solution.moves) {
      alert('Solution data not available');
      return;
    }
    
    await this.playReplay(solution);
  }

  /**
   * Play a solution replay
   */
  private async playReplay(solution: any): Promise<void> {
    // Enter replay mode
    this.isInReplayMode = true;
    this.disablePlayerControls();
    this.showReplayControls(solution.playerName, solution.moveCount);
    
    // Highlight selected leaderboard entry
    const rows = document.querySelectorAll('#leaderboard-body tr');
    rows.forEach(row => {
      const playerCell = row.querySelector('td:nth-child(2)');
      if (playerCell?.textContent?.includes(solution.playerName)) {
        row.classList.add('replaying');
      }
    });
    
    try {
      // Get starting positions from current round data
      const startingPositions = this.currentRound.puzzle.robots;
      
      // Play replay
      await this.replayController.replaySolution(
        solution,
        this.currentRound.puzzle,
        startingPositions,
        this.currentRound.activeGoalIndex
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
    
    // Restore robots to starting positions
    if (this.currentRound) {
      // Render board with starting positions
      this.renderer.render(this.currentRound.puzzle, this.currentRound.activeGoalIndex);
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
    document.querySelectorAll('.robot-selector, #undo-btn, #reset-btn, #submit-btn').forEach(el => {
      (el as HTMLButtonElement).disabled = false;
    });
  }

  /**
   * Hide player controls when round ends
   */
  private hidePlayerControls(): void {
    const robotSelectors = document.querySelector('.robot-selectors') as HTMLElement;
    const moveControls = document.querySelector('.move-controls') as HTMLElement;
    const solutionInfo = document.querySelector('.solution-info') as HTMLElement;
    
    if (robotSelectors) {
      robotSelectors.style.display = 'none';
    }
    if (moveControls) {
      moveControls.style.display = 'none';
    }
    if (solutionInfo) {
      solutionInfo.style.display = 'none';
    }
  }

  /**
   * Show player controls when round is active
   */
  private showPlayerControls(): void {
    const robotSelectors = document.querySelector('.robot-selectors') as HTMLElement;
    const moveControls = document.querySelector('.move-controls') as HTMLElement;
    const solutionInfo = document.querySelector('.solution-info') as HTMLElement;
    
    if (robotSelectors) {
      robotSelectors.style.display = '';
    }
    if (moveControls) {
      moveControls.style.display = '';
    }
    if (solutionInfo) {
      solutionInfo.style.display = '';
    }
  }

  /**
   * Show replay control UI
   */
  private showReplayControls(playerName: string, moveCount: number): void {
    const controls = document.getElementById('replay-controls');
    const replayInfo = document.getElementById('replay-info');
    
    if (controls) {
      controls.style.display = 'block';
    }
    
    if (replayInfo) {
      replayInfo.textContent = `Replaying: ${playerName}'s solution (${moveCount} moves)`;
    }
  }

  /**
   * Hide replay control UI
   */
  private hideReplayControls(): void {
    const controls = document.getElementById('replay-controls');
    const replayInfo = document.getElementById('replay-info');
    
    if (controls) {
      controls.style.display = 'none';
    }
    
    if (replayInfo) {
      replayInfo.textContent = 'Replaying solution...';
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PlayerApp();
});
