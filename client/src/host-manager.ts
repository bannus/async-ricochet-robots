/**
 * Host Manager
 * Handles all host-specific functionality and UI
 * 
 * NEW WORKFLOW (v1.4.0):
 * 1. Click "Preview Goal" → Creates pending round, shows goal
 * 2. Click "Skip" → Updates pending round with new random goal
 * 3. Click "Publish" → Sets deadline and makes round active
 */

import { ApiClient } from './api-client.js';
import { showError, showWarning, showSuccess, showInfo } from './notifications.js';

export class HostManager {
  private pendingRoundId: string | null = null;

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
    const previewBtn = document.getElementById('host-preview-goal');
    const skipBtn = document.getElementById('host-skip-goal');
    const publishBtn = document.getElementById('host-publish-round');
    const completeBtn = document.getElementById('host-complete-round');
    const extendBtn = document.getElementById('host-extend-round');
    
    // Initialize datetime inputs with default values
    this.initializeDatetimeInputs();
    
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.previewGoal());
    }
    
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipGoal());
    }
    
    if (publishBtn) {
      publishBtn.addEventListener('click', () => this.publishRound());
    }
    
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.completeRound());
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
        this.updateButtonStates(result.data);
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
   * Update button states based on game state
   */
  private updateButtonStates(data: any): void {
    const previewBtn = document.getElementById('host-preview-goal') as HTMLButtonElement;
    const skipBtn = document.getElementById('host-skip-goal') as HTMLButtonElement;
    const publishBtn = document.getElementById('host-publish-round') as HTMLButtonElement;
    const completeBtn = document.getElementById('host-complete-round') as HTMLButtonElement;
    
    const hasPending = data.currentState?.hasPendingRound;
    const hasActive = data.currentState?.hasActiveRound;
    
    // Store pending round ID if exists
    if (hasPending && data.currentState.pendingRound) {
      this.pendingRoundId = data.currentState.pendingRound.roundId;
    } else {
      this.pendingRoundId = null;
    }
    
    // Preview: Only enabled when no active or pending round
    if (previewBtn) {
      previewBtn.disabled = hasActive || hasPending;
      previewBtn.textContent = hasPending ? 'Previewing...' : 'Preview Goal';
    }
    
    // Skip/Publish: Only enabled when pending round exists
    if (skipBtn) {
      skipBtn.disabled = !hasPending;
    }
    
    if (publishBtn) {
      publishBtn.disabled = !hasPending;
    }
    
    // Complete: Only enabled when active round exists
    if (completeBtn) {
      completeBtn.disabled = !hasActive;
    }
  }

  /**
   * Preview a new goal (creates pending round)
   * NEW WORKFLOW: Step 1 - Create pending round for preview
   */
  private async previewGoal(): Promise<void> {
    if (!confirm('Generate a random goal to preview?')) {
      return;
    }
    
    try {
      const result = await this.apiClient.startRound(this.gameId, this.hostKey);
      
      if (result.success) {
        this.pendingRoundId = result.data.roundId;
        
        const goal = result.data.goalColor;
        const pos = result.data.goalPosition;
        showInfo(`Goal Preview: ${goal} robot to (${pos.x}, ${pos.y}). Click "Skip" for a different goal, or "Publish" to make it active.`, 5000);
        
        // Reload to show preview
        window.location.reload();
      } else {
        showError('Failed to preview goal: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Preview goal error:', error);
      showError('Error previewing goal: ' + (error as Error).message);
    }
  }

  /**
   * Skip the current preview (get a different goal)
   * NEW WORKFLOW: Call startRound again to update pending round
   */
  private async skipGoal(): Promise<void> {
    if (!this.pendingRoundId) {
      showWarning('No pending round to skip');
      return;
    }
    
    if (!confirm('Skip this goal and get a different one?')) {
      return;
    }
    
    try {
      // Call startRound again - it will update the existing pending round
      const result = await this.apiClient.startRound(this.gameId, this.hostKey);
      
      if (result.success) {
        const goal = result.data.goalColor;
        const pos = result.data.goalPosition;
        const wasUpdate = result.data.isUpdate;
        
        if (wasUpdate) {
          showInfo(`New Goal: ${goal} robot to (${pos.x}, ${pos.y}). Click "Skip" again for another, or "Publish" to make it active.`, 5000);
        } else {
          showInfo(`Goal: ${goal} robot to (${pos.x}, ${pos.y})`, 4000);
        }
        
        window.location.reload();
      } else {
        showError('Failed to skip goal: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Skip goal error:', error);
      showError('Error skipping goal: ' + (error as Error).message);
    }
  }

  /**
   * Publish the pending round (makes it active with deadline)
   * NEW WORKFLOW: Step 3 - Publish with deadline
   */
  private async publishRound(): Promise<void> {
    if (!this.pendingRoundId) {
      showWarning('No pending round to publish');
      return;
    }
    
    const deadlineInput = document.getElementById('host-round-deadline') as HTMLInputElement;
    if (!deadlineInput) {
      showError('Deadline input not found');
      return;
    }
    
    const deadlineValue = deadlineInput.value;
    if (!deadlineValue) {
      showWarning('Please select a deadline for the round');
      return;
    }
    
    // Convert datetime-local string to Unix timestamp
    const endTime = new Date(deadlineValue).getTime();
    
    // Validate that deadline is in the future
    if (endTime <= Date.now()) {
      showWarning('Deadline must be in the future');
      return;
    }
    
    // Format deadline for confirmation
    const deadlineDate = new Date(endTime);
    const formattedDeadline = deadlineDate.toLocaleString();
    
    if (!confirm(`Publish this round with deadline: ${formattedDeadline}?`)) {
      return;
    }
    
    try {
      const result = await this.apiClient.publishRound(
        this.gameId,
        this.hostKey,
        this.pendingRoundId,
        endTime
      );
      
      if (result.success) {
        showSuccess('Round published successfully! Players can now submit solutions.', 4000);
        this.pendingRoundId = null;
        window.location.reload();
      } else {
        showError('Failed to publish round: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Publish round error:', error);
      showError('Error publishing round: ' + (error as Error).message);
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
        showError('Cannot determine current round');
        return;
      }
      
      const result = await this.apiClient.endRound(
        this.gameId,
        this.hostKey,
        roundId
      );
      
      if (result.success) {
        showSuccess('Round completed successfully!', 3000);
        window.location.reload();
      } else {
        showError('Failed to complete round: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Complete round error:', error);
      showError('Error completing round: ' + (error as Error).message);
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
      showError('Deadline input not found');
      return;
    }
    
    const newDeadlineValue = deadlineInput.value;
    if (!newDeadlineValue) {
      showWarning('Please select a new deadline');
      return;
    }
    
    // Convert datetime-local string to Unix timestamp
    const newEndTime = new Date(newDeadlineValue).getTime();
    
    // Validate that new deadline is in the future
    if (newEndTime <= Date.now()) {
      showWarning('New deadline must be in the future');
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
        showError('Cannot determine current round');
        return;
      }
      
      const result = await this.apiClient.extendRound(
        this.gameId,
        this.hostKey,
        roundId,
        newEndTime
      );
      
      if (result.success) {
        showSuccess('Deadline updated successfully', 3000);
        window.location.reload();
      } else {
        showError('Failed to change deadline: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Change deadline error:', error);
      showError('Error changing deadline: ' + (error as Error).message);
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
    
    // Set default for publish deadline
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
      showWarning('Failed to copy. Please copy manually.');
    }
  }
}
