/**
 * Host Authentication Utilities
 * Centralized host authentication and authorization for host-only endpoints
 */

import { HttpRequest } from '@azure/functions';
import { Storage } from './storage';
import { errorResponse } from './validation';

/**
 * Extract game ID and host key from request headers
 * Headers expected: x-game-id and x-host-key
 */
export function extractHostHeaders(request: HttpRequest): { gameId: string; hostKey: string } | null {
  const gameId = request.headers.get('x-game-id');
  const hostKey = request.headers.get('x-host-key');
  
  if (!gameId || !hostKey) {
    return null;
  }
  
  return { gameId, hostKey };
}

/**
 * Authenticate host using hostKey
 * Returns true if hostKey matches the game's hostKey
 */
export async function authenticateHost(gameId: string, providedHostKey: string): Promise<boolean> {
  try {
    const game = await Storage.games.getGame(gameId);
    return game.hostKey === providedHostKey;
  } catch (error) {
    return false;
  }
}

/**
 * Validate and authenticate host from request headers
 * Returns error response if authentication fails, null if successful
 */
export async function validateHostAuth(request: HttpRequest): Promise<
  { gameId: string; hostKey: string } | { error: any }
> {
  // Extract headers
  const headers = extractHostHeaders(request);
  
  if (!headers) {
    return {
      error: errorResponse(
        'Missing required headers: x-game-id and x-host-key',
        'MISSING_HEADERS',
        400
      )
    };
  }
  
  const { gameId, hostKey } = headers;
  
  // Validate gameId format
  if (!gameId.startsWith('game_')) {
    return {
      error: errorResponse(
        'Invalid game ID format',
        'INVALID_GAME_ID',
        400
      )
    };
  }
  
  // Authenticate
  const isAuthenticated = await authenticateHost(gameId, hostKey);
  
  if (!isAuthenticated) {
    return {
      error: errorResponse(
        'Invalid host key. Only the game host can access this endpoint.',
        'UNAUTHORIZED',
        401
      )
    };
  }
  
  return { gameId, hostKey };
}
