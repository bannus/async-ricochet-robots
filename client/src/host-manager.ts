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
    
    // Initialize datetime inputs with default values
    this.initializeDatetimeInputs();
    
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
    const deadlineInput = document.getElementById('host-round-deadline') as HTMLInputElement;
    if (!deadlineInput) return;
    
    const deadlineValue = deadlineInput.value;
    if (!deadlineValue) {
      alert('Please select a deadline for the round');
      return;
    }
    
    // Convert datetime-local string to Unix timestamp
    const endTime = new Date(deadlineValue).getTime();
    
    // Validate that deadline is in the future
    if (endTime <= Date.now()) {
      alert('Deadline must be in the future');
      return;
    }
    
    // Format deadline for confirmation
    const deadlineDate = new Date(endTime);
    const formattedDeadline = deadlineDate.toLocaleString();
    
    if (!confirm(`Start a new round with deadline: ${formattedDeadline}?`)) {
      return;
    }
    
    try {
      const result = await this.apiClient.startRound(this.gameId, this.hostKey, endTime);
      
      if (result.success) {
        alert(`Round ${result.data.round.roundNumber} started successfully!`);
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
   * Change the current round deadline
   */
  private async extendRound(): Promise<void> {
    const deadlineInput = document.getElementById('host-change-deadline') as HTMLInputElement;
    if (!deadlineInput) {
      alert('Deadline input not found');
      return;
    }
    
    const newDeadlineValue = deadlineInput.value;
    if (!newDeadlineValue) {
      alert('Please select a new deadline');
      return;
    }
    
    // Convert datetime-local string to Unix timestamp
    const newEndTime = new Date(newDeadlineValue).getTime();
    
    // Validate that new deadline is in the future
    if (newEndTime <= Date.now()) {
      alert('New deadline must be in the future');
      return;
    }
    
    // Format new deadline for confirmation
    const newDeadlineDate = new Date(newEndTime);
    const formattedDeadline = newDeadlineDate.toLocaleString();
    
    if (!confirm(`Change round deadline to: ${formattedDeadline}?`)) {
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
        newEndTime
      );
      
      if (result.success) {
        alert(`Deadline updated successfully`);
        window.location.reload();
      } else {
        alert('Failed to change deadline: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Change deadline error:', error);
      alert('Error changing deadline: ' + (error as Error).message);
    }
  }

  /**
   * Initialize datetime inputs with sensible defaults
   */
  private initializeDatetimeInputs(): void {
    // Set default deadline to 24 hours from now, rounded to next hour
    const now = new Date();
    const defaultDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    defaultDeadline.setMinutes(0, 0, 0); // Round to hour
    defaultDeadline.setHours(defaultDeadline.getHours() + 1); // Next hour
    
    // Format as datetime-local string (YYYY-MM-DDTHH:mm)
    const formatDatetimeLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    // Set default for start round
    const deadlineInput = document.getElementById('host-round-deadline') as HTMLInputElement;
    if (deadlineInput) {
      deadlineInput.value = formatDatetimeLocal(defaultDeadline);
    }
    
    // Set default for change deadline (also 24h from now)
    const changeDeadlineInput = document.getElementById('host-change-deadline') as HTMLInputElement;
    if (changeDeadlineInput) {
      changeDeadlineInput.value = formatDatetimeLocal(defaultDeadline);
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
