/**
 * Create Game Manager
 * Handles game creation modal and flow
 */

import { ApiClient } from './api-client.js';

export class CreateGameManager {
  constructor(private apiClient: ApiClient) {}

  /**
   * Show the create game screen (no game ID present)
   */
  showCreateScreen(): void {
    const noGameScreen = document.getElementById('no-game-screen');
    const container = document.querySelector('.container') as HTMLElement;
    
    if (noGameScreen) {
      noGameScreen.style.display = 'flex';
    }
    if (container) {
      container.style.display = 'none';
    }
    
    this.setupModal();
  }

  /**
   * Setup modal event handlers
   */
  private setupModal(): void {
    const modal = document.getElementById('create-game-modal');
    const btn = document.getElementById('create-game-btn');
    const closeBtn = document.querySelector('.modal .close');
    const form = document.getElementById('create-game-form');
    
    if (!modal || !btn || !closeBtn || !form) {
      console.error('Create game modal elements not found');
      return;
    }
    
    // Open modal
    btn.addEventListener('click', () => {
      modal.style.display = 'block';
      // Reset form
      (form as HTMLFormElement).reset();
      document.getElementById('create-game-form')!.style.display = 'block';
      document.getElementById('create-success')!.style.display = 'none';
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Close on outside click
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateGame();
    });
    
    // Setup copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.target;
        if (target) {
          this.copyToClipboard(target);
        }
      });
    });
    
    // Note: "Go to Host Panel" button onclick is set dynamically in handleCreateGame()
  }

  /**
   * Handle game creation
   */
  private async handleCreateGame(): Promise<void> {
    const nameInput = document.getElementById('new-game-name') as HTMLInputElement;
    const durationSelect = document.getElementById('new-game-duration') as HTMLSelectElement;
    
    const gameName = nameInput.value.trim();
    const duration = parseInt(durationSelect.value);
    
    if (!gameName) {
      alert('Please enter a game name');
      return;
    }
    
    try {
      const result = await this.apiClient.createGame(gameName, duration);
      
      if (result.success) {
        const gameId = result.data.gameId;
        const hostKey = result.data.hostKey;
        
        // Store host key in localStorage immediately
        localStorage.setItem(`hostKey_${gameId}`, hostKey);
        
        const baseUrl = window.location.origin + window.location.pathname;
        const playerLink = `${baseUrl}?game=${gameId}`;
        
        // Show success state
        document.getElementById('create-game-form')!.style.display = 'none';
        document.getElementById('create-success')!.style.display = 'block';
        
        // Only set player link (host link removed)
        (document.getElementById('created-player-link') as HTMLInputElement).value = playerLink;
        
        // Update "Go to Host Panel" button to navigate to player link
        const gotoBtn = document.getElementById('goto-host-panel');
        if (gotoBtn) {
          gotoBtn.onclick = () => {
            window.location.href = playerLink;
          };
        }
        
      } else {
        alert('Failed to create game: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Create game error:', error);
      alert('Error creating game: ' + (error as Error).message);
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
