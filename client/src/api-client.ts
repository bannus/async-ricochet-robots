/**
 * API Client Module
 * Wrapper for all backend API endpoints with error handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Auto-detect environment if baseUrl not provided
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Check which local development environment we're in
      if (window.location.port === '4280') {
        // SWA emulator (F5 debugging) - use relative path
        // The emulator proxies /api requests to Azure Functions on port 7071
        this.baseUrl = '/api';
      } else if (window.location.port === '8080') {
        // Live-server (npm run dev:client) - point directly to Functions
        this.baseUrl = 'http://localhost:7071/api';
      } else {
        // Other local scenarios - use relative path
        this.baseUrl = '/api';
      }
    } else {
      // Production - use relative path (works with Azure Static Web Apps)
      this.baseUrl = '/api';
    }
  }

  /**
   * Fetch with error handling wrapper
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, options);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
      
      const data: ApiResponse<T> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Return structured error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // ========================================
  // Player Endpoints
  // ========================================

  /**
   * Get current round information for a game
   */
  async getCurrentRound(gameId: string): Promise<ApiResponse> {
    const url = `${this.baseUrl}/getCurrentRound?gameId=${encodeURIComponent(gameId)}`;
    return this.fetchWithErrorHandling(url);
  }

  /**
   * Get leaderboard for a specific round
   */
  async getLeaderboard(gameId: string, roundId: string): Promise<ApiResponse> {
    const url = `${this.baseUrl}/getLeaderboard?gameId=${encodeURIComponent(gameId)}&roundId=${encodeURIComponent(roundId)}`;
    return this.fetchWithErrorHandling(url);
  }

  /**
   * Submit a solution for the current round
   */
  async submitSolution(
    gameId: string,
    roundId: string,
    playerName: string,
    moves: Array<{ robot: string; direction: string }>
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}/submitSolution`;
    
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameId,
        roundId,
        playerName,
        moves
      })
    });
  }

  // ========================================
  // Game Management Endpoints
  // ========================================

  /**
   * Create a new game
   */
  async createGame(
    gameName: string,
    defaultRoundDurationMs: number = 86400000 // 24 hours default
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}/createGame`;
    
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameName,
        defaultRoundDurationMs
      })
    });
  }

  // ========================================
  // Host Endpoints
  // ========================================

  /**
   * Start a new round (host only)
   */
  async startRound(
    gameId: string,
    hostKey: string,
    durationMs?: number
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}/host/startRound`;
    
    const body: any = {};
    if (durationMs !== undefined) {
      body.durationMs = durationMs;
    }
    
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      },
      body: JSON.stringify(body)
    });
  }

  /**
   * Extend current round deadline (host only)
   */
  async extendRound(
    gameId: string,
    hostKey: string,
    roundId: string,
    extendByMs: number
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}/host/extendRound`;
    
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      },
      body: JSON.stringify({
        roundId,
        extendByMs
      })
    });
  }

  /**
   * End current round (host only)
   */
  async endRound(
    gameId: string,
    hostKey: string,
    roundId: string,
    skipGoal: boolean = false
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}/host/endRound`;
    
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      },
      body: JSON.stringify({
        roundId,
        skipGoal
      })
    });
  }

  /**
   * Get host dashboard data (host only)
   */
  async getDashboard(gameId: string, hostKey: string): Promise<ApiResponse> {
    const url = `${this.baseUrl}/host/dashboard`;
    
    return this.fetchWithErrorHandling(url, {
      method: 'GET',
      headers: {
        'X-Game-Id': gameId,
        'X-Host-Key': hostKey
      }
    });
  }

  /**
   * Check if a game ID is valid
   */
  async validateGameId(gameId: string): Promise<boolean> {
    try {
      const response = await this.getCurrentRound(gameId);
      return response.success;
    } catch {
      return false;
    }
  }
}
