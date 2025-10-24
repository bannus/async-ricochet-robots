/**
 * Game History Manager
 * Manages localStorage-based game history for quick access to recent games
 */

/**
 * Game History Entry
 */
export interface GameHistoryEntry {
  gameId: string;
  gameName: string;
  lastVisited: number;
  isHost: boolean;
}

/**
 * Game History Manager
 * Manages localStorage-based game history
 */
export class GameHistoryManager {
  private static readonly STORAGE_KEY = 'gameHistory';
  private static readonly MAX_HISTORY = 10;

  /**
   * Add or update a game in history
   */
  static addGame(gameId: string, gameName: string, isHost: boolean): void {
    const history = this.getHistory();
    
    // Remove existing entry if present
    const filtered = history.filter(entry => entry.gameId !== gameId);
    
    // Add new entry at the beginning
    filtered.unshift({
      gameId,
      gameName,
      lastVisited: Date.now(),
      isHost
    });
    
    // Keep only last MAX_HISTORY entries
    const trimmed = filtered.slice(0, this.MAX_HISTORY);
    
    this.saveHistory(trimmed);
  }

  /**
   * Remove a game from history
   */
  static removeGame(gameId: string): void {
    const history = this.getHistory();
    const filtered = history.filter(entry => entry.gameId !== gameId);
    this.saveHistory(filtered);
  }

  /**
   * Get recent games (sorted by most recent first)
   */
  static getRecentGames(): GameHistoryEntry[] {
    return this.getHistory();
  }

  /**
   * Get history from localStorage
   */
  private static getHistory(): GameHistoryEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading game history:', error);
      return [];
    }
  }

  /**
   * Save history to localStorage
   */
  private static saveHistory(history: GameHistoryEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving game history:', error);
    }
  }

  /**
   * Format timestamp as relative time
   */
  static formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Render game history list
   */
  static renderGameList(): void {
    const section = document.getElementById('recent-games-section');
    const list = document.getElementById('recent-games-list');
    
    if (!section || !list) return;
    
    const games = this.getRecentGames();
    
    // Show/hide section based on history
    if (games.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    list.innerHTML = '';
    
    games.forEach(game => {
      const li = document.createElement('li');
      li.className = 'game-history-item';
      li.setAttribute('data-game-id', game.gameId);
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'game-history-name';
      
      if (game.isHost) {
        const badge = document.createElement('span');
        badge.className = 'game-history-host-badge';
        badge.textContent = '🔑';
        badge.setAttribute('title', "You're the host");
        nameDiv.appendChild(badge);
      }
      
      const nameText = document.createElement('span');
      nameText.textContent = game.gameName;
      nameDiv.appendChild(nameText);
      
      const timeDiv = document.createElement('div');
      timeDiv.className = 'game-history-time';
      timeDiv.textContent = this.formatRelativeTime(game.lastVisited);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'game-history-delete';
      deleteBtn.textContent = '×';
      deleteBtn.setAttribute('aria-label', `Remove ${game.gameName} from history`);
      deleteBtn.setAttribute('data-game-id', game.gameId);
      
      li.appendChild(nameDiv);
      li.appendChild(timeDiv);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
    
    // Add event listeners
    this.attachEventListeners();
  }

  /**
   * Attach click event listeners to game entries and delete buttons
   */
  private static attachEventListeners(): void {
    const list = document.getElementById('recent-games-list');
    if (!list) return;
    
    // Click on game entry to navigate
    list.querySelectorAll('.game-history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        // Don't navigate if clicking delete button
        if (target.classList.contains('game-history-delete')) {
          return;
        }
        
        const gameId = (item as HTMLElement).getAttribute('data-game-id');
        if (gameId) {
          const baseUrl = window.location.origin + window.location.pathname;
          window.location.href = `${baseUrl}?game=${gameId}`;
        }
      });
    });
    
    // Delete button handlers
    list.querySelectorAll('.game-history-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent navigation
        
        const gameId = (btn as HTMLElement).getAttribute('data-game-id');
        if (gameId && confirm('Remove this game from your history?')) {
          this.removeGame(gameId);
          this.renderGameList();
        }
      });
    });
  }
}
