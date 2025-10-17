/**
 * Host Manager
 * Handles all host-specific functionality and UI
 */

import { ApiClient } from './api-client.js';

export class HostManager {
  constructor(
    private gameId: string,
    private hostKey: string,
    private apiClient: ApiClient
  ) {}

  /**
   * Initialize host controls and event listeners
   */
  initialize(): void {
    this.showHostControls();
    this.setupEventListeners();
    this.setupShareLinks();
  }

  /**
   * Show host controls section
   */
  private showHostControls(): void {
    const hostSection = document.getElementById('host-controls');
    if (hostSection) {
      hostSection.style.display = 'block';
    }
  }

  /**
   * Setup host-specific event listeners
   */
  private setupEventListeners(): void {
    const startBtn = document.getElementById('host-start-round');
    const completeBtn = document.getElementById('host-complete-round');
    const skipBtn = document.getElementById('host-skip-goal');
    const extendBtn = document.getElementById('host-extend-round');
    
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startRound());
    }
    
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.completeRound());
    }
    
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipGoal());
    }
    
    if (extendBtn) {
      extendBtn.addEventListener('click', () => this.extendRound());
    }

    // Setup copy button for share link
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.target;
        if (target) {
          this.copyToClipboard(target);
        }
      });
    });
  }

  /**
   * Setup share links
   */
  private setupShareLinks(): void {
    const baseUrl = window.location.origin + window.location.pathname;
    const playerLink = `${baseUrl}?game=${this.gameId}`;
    
    const shareLinkInput = document.getElementById('share-player-link') as HTMLInputElement;
    if (shareLinkInput) {
      shareLinkInput.value = playerLink;
    }
  }

  /**
   * Load and display host dashboard data
   */
  async loadDashboard(): Promise<void> {
    try {
      const result = await this.apiClient.getDashboard(this.gameId, this.hostKey);
      
      if (result.success) {
        this.displayStats(result.data);
      } else {
        console.error('Failed to load host dashboard:', result.error);
      }
    } catch (error) {
      console.error('Error loading host dashboard:', error);
    }
  }

  /**
   * Display host statistics
   */
  private displayStats(data: any): void {
    const goalsElem = document.getElementById('host-goals-completed');
    const playersElem = document.getElementById('host-total-players');
    const solutionsElem = document.getElementById('host-total-solutions');
    
    if (goalsElem && data.progress) {
      const completed = data.progress.goalsCompleted || 0;
      const total = data.progress.totalGoals || 17;
      goalsElem.textContent = `${completed}/${total}`;
    }
    
    if (playersElem && data.statistics) {
      playersElem.textContent = (data.statistics.uniquePlayers || 0).toString();
    }
    
    if (solutionsElem && data.statistics) {
      solutionsElem.textContent = (data.statistics.totalSolutions || 0).toString();
    }
  }

  /**
   * Start a new round
   */
  private async startRound(): Promise<void> {
    const durationSelect = document.getElementById('host-round-duration') as HTMLSelectElement;
    if (!durationSelect) return;
    
    const duration = parseInt(durationSelect.value);
    const hours = duration / 3600000;
    
    if (!confirm(`Start a new round with ${hours} hour duration?`)) {
      return;
    }
    
    try {
      const result = await this.apiClient.startRound(this.gameId, this.hostKey, duration);
      
      if (result.success) {
        alert(`Round ${result.data.roundNumber} started successfully!`);
        // Trigger page reload to show new round
        window.location.reload();
      } else {
        alert('Failed to start round: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Start round error:', error);
      alert('Error starting round: ' + (error as Error).message);
    }
  }

  /**
   * Complete the current round (mark goal as completed)
   */
  private async completeRound(): Promise<void> {
    if (!confirm('Complete this round and mark the goal as solved?')) {
      return;
    }
    
    try {
      const roundId = this.getCurrentRoundId();
      if (!roundId) {
        alert('Cannot determine current round');
        return;
      }
      
      const result = await this.apiClient.endRound(
        this.gameId,
        this.hostKey,
        roundId,
        false // skipGoal = false
      );
      
      if (result.success) {
        alert('Round completed successfully!');
        window.location.reload();
      } else {
        alert('Failed to complete round: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Complete round error:', error);
      alert('Error completing round: ' + (error as Error).message);
    }
  }

  /**
   * Skip the current goal (return it to the pool)
   */
  private async skipGoal(): Promise<void> {
    if (!confirm('Skip this goal? It will be available again in a future round.')) {
      return;
    }
    
    try {
      const roundId = this.getCurrentRoundId();
      if (!roundId) {
        alert('Cannot determine current round');
        return;
      }
      
      const result = await this.apiClient.endRound(
        this.gameId,
        this.hostKey,
        roundId,
        true // skipGoal = true
      );
      
      if (result.success) {
        alert('Goal skipped successfully!');
        window.location.reload();
      } else {
        alert('Failed to skip goal: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Skip goal error:', error);
      alert('Error skipping goal: ' + (error as Error).message);
    }
  }

  /**
   * Get the current round ID from the page
   */
  private getCurrentRoundId(): string | null {
    const roundNumberElem = document.getElementById('round-number');
    if (!roundNumberElem) {
      return null;
    }
    
    const roundText = roundNumberElem.textContent || '';
    const match = roundText.match(/Round (\d+)/);
    if (!match) {
      return null;
    }
    
    return `${this.gameId}_round${match[1]}`;
  }

  /**
   * Extend the current round deadline
   */
  private async extendRound(): Promise<void> {
    const hours = prompt('Extend deadline by how many hours?', '6');
    if (!hours) return;
    
    const extendByMs = parseInt(hours) * 3600000;
    if (isNaN(extendByMs) || extendByMs <= 0) {
      alert('Please enter a valid number of hours');
      return;
    }
    
    try {
      const roundId = this.getCurrentRoundId();
      if (!roundId) {
        alert('Cannot determine current round');
        return;
      }
      
      const result = await this.apiClient.extendRound(
        this.gameId,
        this.hostKey,
        roundId,
        extendByMs
      );
      
      if (result.success) {
        alert(`Deadline extended by ${hours} hours`);
        window.location.reload();
      } else {
        alert('Failed to extend deadline: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Extend round error:', error);
      alert('Error extending deadline: ' + (error as Error).message);
    }
  }

  /**
   * Copy text to clipboard
   */
  private copyToClipboard(elementId: string): void {
    const input = document.getElementById(elementId) as HTMLInputElement;
    if (!input) return;
    
    input.select();
    input.setSelectionRange(0, 99999); // For mobile devices
    
    try {
      document.execCommand('copy');
      
      // Show feedback
      const btn = document.querySelector(`[data-target="${elementId}"]`) as HTMLElement;
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please copy manually.');
    }
  }
}
