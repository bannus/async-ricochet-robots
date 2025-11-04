/**
 * UI State Manager
 * Manages UI visibility and state transitions for different game states
 */

export class UIStateManager {
  /**
   * Show the active round UI (main game content)
   */
  showActiveRound(): void {
    this.hideAllStates();
    
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.display = 'flex';
    }
  }

  /**
   * Show "no active round" state
   */
  showNoActiveRound(goalsCompleted: number = 0, goalsRemaining: number = 17): void {
    this.hideAllStates();
    
    const noRoundMsg = document.getElementById('no-round-message');
    const gameStats = document.getElementById('game-stats');
    
    if (noRoundMsg) {
      noRoundMsg.style.display = 'block';
    }
    
    if (gameStats) {
      gameStats.innerHTML = `
        <p>Goals completed: ${goalsCompleted} / 17</p>
        <p>Goals remaining: ${goalsRemaining}</p>
      `;
    }
  }

  /**
   * Show "game complete" state
   */
  showGameComplete(): void {
    this.hideAllStates();
    
    const completeMsg = document.getElementById('game-complete-message');
    if (completeMsg) {
      completeMsg.style.display = 'block';
    }
  }

  /**
   * Show error state
   */
  showError(message: string): void {
    this.hideAllStates();
    
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorMsg) {
      errorMsg.style.display = 'block';
    }
    if (errorText) {
      errorText.textContent = message;
    }
  }

  /**
   * Update header information
   */
  updateHeader(gameName: string, roundNumber: number): void {
    const gameNameEl = document.getElementById('game-name');
    const roundNumberEl = document.getElementById('round-number');
    
    if (gameNameEl) {
      gameNameEl.textContent = gameName;
    }
    if (roundNumberEl) {
      roundNumberEl.textContent = `Round ${roundNumber}`;
    }
  }

  /**
   * Update goal description
   */
  updateGoalDescription(text: string): void {
    const goalDesc = document.getElementById('goal-description');
    if (goalDesc) {
      goalDesc.innerHTML = text;
    }
  }

  /**
   * Update goal status message
   */
  updateGoalStatus(message: string, className: string = ''): void {
    const goalStatus = document.getElementById('goal-status');
    if (goalStatus) {
      goalStatus.className = className;
      goalStatus.textContent = message;
    }
  }

  /**
   * Clear goal status message
   */
  clearGoalStatus(): void {
    const goalStatus = document.getElementById('goal-status');
    if (goalStatus) {
      goalStatus.className = '';
      goalStatus.textContent = '';
    }
  }

  /**
   * Add or remove 'round-ended' class from goal info
   */
  setRoundEnded(ended: boolean): void {
    const goalInfo = document.querySelector('.goal-info');
    if (goalInfo) {
      if (ended) {
        goalInfo.classList.add('round-ended');
      } else {
        goalInfo.classList.remove('round-ended');
      }
    }
  }

  /**
   * Show/hide player controls (robot selectors, move controls, solution info)
   */
  setPlayerControlsVisible(visible: boolean): void {
    const robotSelectors = document.querySelector('.robot-selectors') as HTMLElement;
    const moveControls = document.querySelector('.move-controls') as HTMLElement;
    const solutionInfo = document.querySelector('.solution-info') as HTMLElement;
    
    const display = visible ? '' : 'none';
    
    if (robotSelectors) {
      robotSelectors.style.display = display;
    }
    if (moveControls) {
      moveControls.style.display = display;
    }
    if (solutionInfo) {
      solutionInfo.style.display = display;
    }
  }

  /**
   * Enable/disable player control buttons
   */
  setPlayerControlsEnabled(enabled: boolean): void {
    document.querySelectorAll('.robot-selector, #undo-btn, #reset-btn, #submit-btn').forEach(el => {
      (el as HTMLButtonElement).disabled = !enabled;
    });
  }

  /**
   * Show replay controls UI
   */
  showReplayControls(playerName: string, moveCount: number): void {
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
   * Hide replay controls UI
   */
  hideReplayControls(): void {
    const controls = document.getElementById('replay-controls');
    const replayInfo = document.getElementById('replay-info');
    
    if (controls) {
      controls.style.display = 'none';
    }
    
    if (replayInfo) {
      replayInfo.textContent = 'Replaying solution...';
    }
  }

  /**
   * Hide all state-specific UI elements
   */
  private hideAllStates(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    const noRoundMsg = document.getElementById('no-round-message');
    const completeMsg = document.getElementById('game-complete-message');
    const errorMsg = document.getElementById('error-message');
    
    if (mainContent) mainContent.style.display = 'none';
    if (noRoundMsg) noRoundMsg.style.display = 'none';
    if (completeMsg) completeMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
  }
}
