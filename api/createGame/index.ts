/**
 * POST /api/createGame
 * 
 * Create a new game with a randomly generated puzzle.
 * Generates unique game ID and host key, creates board with 17 goals,
 * and returns shareable URLs for players and host.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage, BoardData } from '../shared/storage';
import {
  validateCreateGameRequest,
  successResponse,
  handleError
} from '../shared/validation';
import { generatePuzzle } from '../../dist/shared/game-engine';
import { randomBytes } from 'crypto';

/**
 * Generate a unique game ID
 * Format: game_[16 hex characters]
 */
function generateGameId(): string {
  return 'game_' + randomBytes(8).toString('hex');
}

/**
 * Generate a secure host key
 * Format: host_[24 hex characters]
 */
function generateHostKey(): string {
  return 'host_' + randomBytes(12).toString('hex');
}

/**
 * Generate game URLs for sharing
 */
function generateUrls(gameId: string, hostKey: string, baseUrl?: string): {
  playerUrl: string;
  hostUrl: string;
} {
  // Use provided base URL or default for production
  const base = baseUrl || 'https://ricochet-robots.azurewebsites.net';
  
  return {
    playerUrl: `${base}/?game=${gameId}`,
    hostUrl: `${base}/host.html?game=${gameId}&key=${hostKey}`
  };
}

export async function createGame(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Parse and validate request body (gameName and defaultRoundDurationMs are optional)
    const body = await request.json() as any;
    validateCreateGameRequest(body);

    const gameName = body.gameName;
    const defaultRoundDurationMs = body.defaultRoundDurationMs || 86400000; // Default: 24 hours

    context.log('createGame: Generating new game...');

    // Generate unique identifiers
    const gameId = generateGameId();
    const hostKey = generateHostKey();

    context.log(`Generated: gameId=${gameId}, hostKey=${hostKey.substring(0, 10)}...`);

    // Generate puzzle using game engine (17 goals, walls, robots)
    const puzzle = generatePuzzle();

    context.log(`Puzzle generated: ${puzzle.goals.length} goals, walls configured`);

    // Prepare board data for storage
    const boardData: BoardData = {
      walls: puzzle.walls,
      robots: puzzle.robots,
      allGoals: puzzle.goals,
      completedGoalIndices: []
    };

    // Create game in storage
    const game = await Storage.games.createGame(
      gameId,
      hostKey,
      boardData,
      defaultRoundDurationMs,
      gameName
    );

    context.log(`Game created successfully: ${gameId}`);

    // Generate shareable URLs
    // Check if X-Forwarded-Host header exists (for production)
    const forwardedHost = request.headers.get('x-forwarded-host');
    const baseUrl = forwardedHost 
      ? `https://${forwardedHost}` 
      : undefined; // Will use default in generateUrls

    const urls = generateUrls(gameId, hostKey, baseUrl);

    // Return success response with game details
    return successResponse({
      gameId,
      hostKey,
      gameName: gameName || 'Untitled Game',
      defaultRoundDurationMs,
      createdAt: game.createdAt,
      totalGoals: 17,
      goalsCompleted: 0,
      urls: {
        player: urls.playerUrl,
        host: urls.hostUrl
      },
      message: 'Game created successfully! Share the player URL with your friends. Keep the host URL private - it gives you control over the game.',
      nextSteps: [
        'Share the player URL with participants',
        'Visit the host URL to start the first round',
        'Players can join at any time'
      ]
    });

  } catch (error: any) {
    context.error('createGame error:', error);
    return handleError(error);
  }
}

app.http('createGame', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createGame
});
