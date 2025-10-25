/**
 * Leaderboard Manager
 * Manages leaderboard display, highlighting, and interaction
 */

export class LeaderboardManager {
  private previousLeaderboardKeys: Set<string> = new Set();
  private onLeaderboardClick?: (index: number, solutions: any[]) => void;
  private onLeaderboardHover?: (index: number, solutions: any[]) => void;
  private onLeaderboardLeave?: () => void;

  /**
   * Set callback for when leaderboard entry is clicked
   */
  setClickHandler(handler: (index: number, solutions: any[]) => void): void {
    this.onLeaderboardClick = handler;
  }

  /**
   * Set callback for when leaderboard entry is hovered
   */
  setHoverHandler(handler: (index: number, solutions: any[]) => void): void {
    this.onLeaderboardHover = handler;
  }

  /**
   * Set callback for when mouse leaves leaderboard entry
   */
  setLeaveHandler(handler: () => void): void {
    this.onLeaderboardLeave = handler;
  }

  /**
   * Display leaderboard data
   */
  display(data: any): void {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    
    // Track current entries to detect new ones
    const currentKeys = new Set<string>();
    
    tbody.innerHTML = '';
    
    if (!data.solutions || data.solutions.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4">No solutions yet. Be the first!</td>';
      tbody.appendChild(row);
      // Clear previous keys since there are no entries
      this.previousLeaderboardKeys.clear();
      return;
    }
    
    // Get saved player name for highlighting
    const savedName = localStorage.getItem('playerName');
    
    data.solutions.forEach((solution: any, index: number) => {
      const row = document.createElement('tr');
      
      // Create unique key for this entry (playerName + submittedAt timestamp)
      const entryKey = `${solution.playerName}_${solution.submittedAt}`;
      currentKeys.add(entryKey);
      
      // Check if this is a new entry
      const isNewEntry = !this.previousLeaderboardKeys.has(entryKey);
      if (isNewEntry) {
        row.classList.add('new-entry');
      }
      
      // Highlight current player
      if (savedName && solution.playerName.toLowerCase() === savedName.toLowerCase()) {
        row.classList.add('current-player');
      }
      
      // Display player name with submission number if available
      const playerDisplay = solution.submissionNumber 
        ? `${this.escapeHtml(solution.playerName)} <span class="tie-indicator">(#${solution.submissionNumber})</span>`
        : this.escapeHtml(solution.playerName);
      
      row.innerHTML = `
        <td>${solution.rank}</td>
        <td>${playerDisplay}</td>
        <td>${solution.moveCount}</td>
        <td>${this.formatTime(solution.submittedAt)}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    // Update previous keys for next comparison
    this.previousLeaderboardKeys = currentKeys;
    
    // Setup click handlers if round ended
    this.setupClickHandlers(data);
  }

  /**
   * Remove highlighting from all leaderboard rows
   */
  clearReplayHighlight(): void {
    document.querySelectorAll('#leaderboard-body tr').forEach(row => {
      row.classList.remove('replaying');
    });
  }

  /**
   * Highlight a specific leaderboard entry (for replay mode)
   */
  highlightEntry(playerName: string): void {
    const rows = document.querySelectorAll('#leaderboard-body tr');
    rows.forEach(row => {
      const playerCell = row.querySelector('td:nth-child(2)');
      if (playerCell?.textContent?.includes(playerName)) {
        row.classList.add('replaying');
      }
    });
  }

  /**
   * Setup click handlers for leaderboard entries (replay mode)
   */
  private setupClickHandlers(data: any): void {
    // Only enable when round has ended
    if (data.roundStatus !== 'completed') {
      return;
    }
    
    const leaderboardRows = document.querySelectorAll('#leaderboard-body tr');
    leaderboardRows.forEach((row, index) => {
      row.classList.add('clickable');
      
      // Click handler for full replay
      row.addEventListener('click', () => {
        if (this.onLeaderboardClick) {
          this.onLeaderboardClick(index, data.solutions);
        }
      });
      
      // Hover handler for path preview
      row.addEventListener('mouseenter', () => {
        if (this.onLeaderboardHover) {
          this.onLeaderboardHover(index, data.solutions);
        }
      });
      
      // Clear preview on mouse leave
      row.addEventListener('mouseleave', () => {
        if (this.onLeaderboardLeave) {
          this.onLeaderboardLeave();
        }
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
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
