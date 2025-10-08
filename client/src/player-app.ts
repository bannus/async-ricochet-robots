/**
 * Player Application Main Controller
 * Coordinates API calls, rendering, game controller, and UI state
 */

import { ApiClient } from './api-client.js';
import { GameRenderer } from './game-renderer.js';
import { GameController } from './game-controller.js';
import { CreateGameManager } from './create-game.js';
import { HostManager } from './host-manager.js';

export class PlayerApp {
  private apiClient!: ApiClient;
  private renderer!: GameRenderer;
  private controller!: GameController;
  private createGameManager?: CreateGameManager;
  private hostManager?: HostManager;
  
  private gameId: string = '';
  private currentRound: any = null;
  private pollingInterval: number | null = null;

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
    
    // Case 2: Initialize game components
    this.renderer = new GameRenderer('game-board');
    this.controller = new GameController(this.renderer, this.apiClient);
    
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
      
      if (data.status !== 'active') {
        this.showNoActiveRound(data);
        return;
      }
      
      // Active round exists
      this.currentRound = data;
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
    
    // Find goal index in allGoals array
    const goalIndex = data.puzzle.allGoals.findIndex((g: any) =>
      g.position.x === data.puzzle.goalPosition.x &&
      g.position.y === data.puzzle.goalPosition.y
    );
    
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
      }, goalIndex);
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
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PlayerApp();
});
