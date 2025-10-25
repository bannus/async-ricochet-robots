/**
 * Replay Mode Manager
 * Manages replay mode state and coordinates replay playback
 */

import { ReplayController } from './replay-controller.js';
import { GameRenderer } from './game-renderer.js';
import { UIStateManager } from './ui-state-manager.js';
import { LeaderboardManager } from './leaderboard-manager.js';
import { showError, showWarning } from './notifications.js';

export class ReplayModeManager {
  private isInReplayMode: boolean = false;
  private replayController: ReplayController;
  private uiState: UIStateManager;
  private leaderboard: LeaderboardManager;
  private currentRound: any = null;

  constructor(
    renderer: GameRenderer,
    uiState: UIStateManager,
    leaderboard: LeaderboardManager
  ) {
    this.replayController = new ReplayController(renderer);
    this.uiState = uiState;
    this.leaderboard = leaderboard;
  }

  /**
   * Check if currently in replay mode
   */
  isActive(): boolean {
    return this.isInReplayMode;
  }

  /**
   * Set the current round data for replay
   */
  setCurrentRound(round: any): void {
    this.currentRound = round;
  }

  /**
   * Handle click on a leaderboard entry
   */
  async handleLeaderboardClick(solutionIndex: number, solutions: any[]): Promise<void> {
    // If already replaying, stop current replay first
    if (this.isInReplayMode) {
      this.replayController.stopReplay();
      this.leaderboard.clearReplayHighlight();
    }
    
    const solution = solutions[solutionIndex];
    
    if (!solution.moves) {
      showWarning('Solution data not available');
      return;
    }
    
    await this.playReplay(solution);
  }

  /**
   * Handle hovering over a leaderboard entry - show path preview
   */
  handleLeaderboardHover(solutionIndex: number, solutions: any[], renderer: GameRenderer): void {
    // Don't show preview if already in replay mode
    if (this.isInReplayMode || !this.currentRound) {
      return;
    }
    
    const solution = solutions[solutionIndex];
    
    if (!solution.moves) {
      return;
    }
    
    // Draw path preview on top of current board state
    renderer.drawSolutionPathPreview(
      solution.moves,
      this.currentRound.puzzle.robots,
      solution.winningRobot,
      this.currentRound.puzzle,
      this.currentRound.activeGoalIndex
    );
  }

  /**
   * Clear the path preview and restore normal board view
   */
  clearPathPreview(renderer: GameRenderer): void {
    // Don't clear if in replay mode
    if (this.isInReplayMode || !this.currentRound) {
      return;
    }
    
    // Simply re-render the board to its current state
    renderer.render(this.currentRound.puzzle, this.currentRound.activeGoalIndex);
  }

  /**
   * Play a solution replay
   */
  private async playReplay(solution: any): Promise<void> {
    if (!this.currentRound) {
      showError('No round data available for replay');
      return;
    }

    // Enter replay mode
    this.isInReplayMode = true;
    this.uiState.setPlayerControlsEnabled(false);
    this.uiState.showReplayControls(solution.playerName, solution.moveCount);
    
    // Highlight selected leaderboard entry
    this.leaderboard.highlightEntry(solution.playerName);
    
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
      showError('Failed to replay solution');
    }
  }

  /**
   * Exit replay mode
   */
  exit(renderer: GameRenderer): void {
    this.isInReplayMode = false;
    this.replayController.stopReplay();
    this.uiState.setPlayerControlsEnabled(true);
    this.uiState.hideReplayControls();
    
    // Remove highlighting
    this.leaderboard.clearReplayHighlight();
    
    // Restore robots to starting positions
    if (this.currentRound) {
      renderer.render(this.currentRound.puzzle, this.currentRound.activeGoalIndex);
    }
  }
}
