/**
 * POST /api/host/extendRound
 * 
 * Extend the deadline of an active round.
 * Host-only endpoint - requires valid hostKey for authentication.
 * Adds additional time to the current round's end time.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
  validateExtendRoundRequest,
  successResponse,
  errorResponse,
  handleError
} from '../../shared/validation';

/**
 * Authenticate host using hostKey
 * Returns true if hostKey matches the game's hostKey
 */
async function authenticateHost(gameId: string, providedHostKey: string): Promise<boolean> {
  try {
    const game = await Storage.games.getGame(gameId);
    return game.hostKey === providedHostKey;
  } catch (error) {
    return false;
  }
}

export async function extendRound(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Parse and validate request body
    const body = await request.json() as any;
    validateExtendRoundRequest(body);

    const { gameId, roundId, hostKey, additionalTimeMs } = body;

    context.log(`extendRound: gameId=${gameId}, roundId=${roundId}, additionalTime=${additionalTimeMs}ms`);

    // Authenticate host
    const isAuthenticated = await authenticateHost(gameId, hostKey);
    if (!isAuthenticated) {
      return errorResponse(
        'Invalid host key. Only the game host can extend rounds.',
        'UNAUTHORIZED',
        401
      );
    }

    // Get round data
    const round = await Storage.rounds.getRound(gameId, roundId);

    // Check if round is still active
    if (round.status !== 'active') {
      return errorResponse(
        `Cannot extend a ${round.status} round. Only active rounds can be extended.`,
        'ROUND_NOT_ACTIVE',
        400
      );
    }

    // Calculate new end time
    const newEndTime = round.endTime + additionalTimeMs;
    const now = Date.now();

    context.log(`Current endTime: ${round.endTime}, New endTime: ${newEndTime}`);

    // Update round with new end time
    await Storage.rounds.updateRound(gameId, roundId, {
      endTime: newEndTime
    });

    const timeRemaining = newEndTime - now;
    const hoursAdded = Math.round(additionalTimeMs / (1000 * 60 * 60) * 10) / 10;

    context.log(`Round ${roundId} extended by ${hoursAdded} hours`);

    // Return success with updated timing
    return successResponse({
      message: `Round deadline extended by ${hoursAdded} hours.`,
      round: {
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        gameId: round.gameId,
        goal: round.goal,
        originalEndTime: round.endTime,
        newEndTime: newEndTime,
        timeAdded: additionalTimeMs,
        timeRemaining: timeRemaining,
        status: 'active'
      },
      timing: {
        previousDeadline: new Date(round.endTime).toISOString(),
        newDeadline: new Date(newEndTime).toISOString(),
        extensionHours: hoursAdded,
        remainingMs: timeRemaining,
        remainingHours: Math.round(timeRemaining / (1000 * 60 * 60) * 10) / 10
      },
      nextSteps: [
        'Players now have more time to submit solutions',
        'The leaderboard will remain open until the new deadline',
        'End the round manually or wait for the timer'
      ]
    });

  } catch (error: any) {
    context.error('extendRound error:', error);
    return handleError(error);
  }
}

app.http('extendRound', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'host/extendRound',
  handler: extendRound
});
