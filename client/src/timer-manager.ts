/**
 * Timer Manager
 * Manages countdown timer for active rounds
 */

export class TimerManager {
  private timerInterval: number | null = null;
  private timerElement: HTMLElement | null = null;

  constructor() {
    this.timerElement = document.getElementById('time-remaining');
  }

  /**
   * Start countdown timer for a round
   */
  start(endTime: number): void {
    if (!this.timerElement) return;
    
    // Clear any existing timer first to prevent multiple timers running
    this.stop();
    
    // Handle invalid/missing endTime (preview mode)
    if (!endTime || endTime <= 0) {
      this.timerElement.textContent = 'Waiting to start...';
      return;
    }
    
    // Update timer immediately, then every second
    this.updateDisplay(endTime);
    this.timerInterval = window.setInterval(() => {
      this.updateDisplay(endTime);
    }, 1000);
  }

  /**
   * Stop the timer
   */
  stop(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Update timer display
   */
  private updateDisplay(endTime: number): void {
    if (!this.timerElement) return;
    
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    
    if (remaining === 0) {
      this.timerElement.textContent = 'Round ended';
      this.stop();
      return;
    }
    
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    this.timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
  }
}
