/**
 * POST /api/host/extendRound
 * 
 * Change the deadline of an active round to a new absolute time.
 * Host-only endpoint - requires valid hostKey for authentication.
 * Sets a new end time for the current round.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
  validateExtendRoundRequest,
  successResponse,
  errorResponse,
  handleError
} from '../../shared/validation';
import { validateHostAuth } from '../../shared/host-auth';

async function extendRoundHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate host from headers
    const authResult = await validateHostAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { gameId } = authResult;

    // Parse and validate request body
    const body = await request.json() as any;
    validateExtendRoundRequest(body);

    const { roundId, newEndTime } = body;

    context.log(`extendRound: gameId=${gameId}, roundId=${roundId}, newEndTime=${newEndTime}`);

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

    // Validate new end time
    const now = Date.now();
    
    if (newEndTime <= now) {
      return errorResponse(
        'New deadline must be in the future',
        'INVALID_DEADLINE',
        400
      );
    }

    if (newEndTime <= round.endTime) {
      return errorResponse(
        'New deadline must be after current deadline',
        'INVALID_DEADLINE',
        400
      );
    }

    context.log(`Current endTime: ${round.endTime}, New endTime: ${newEndTime}`);

    // Update round with new end time
    await Storage.rounds.updateRound(gameId, roundId, {
      endTime: newEndTime
    });

    const timeRemaining = newEndTime - now;
    const timeAdded = newEndTime - round.endTime;
    const hoursAdded = Math.round(timeAdded / (1000 * 60 * 60) * 10) / 10;

    context.log(`Round ${roundId} deadline changed to ${new Date(newEndTime).toISOString()}`);

    // Return success with updated timing
    return successResponse({
      message: `Round deadline updated successfully.`,
      round: {
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        gameId: round.gameId,
        goal: round.goal,
        oldEndTime: round.endTime,
        newEndTime: newEndTime,
        timeRemaining: timeRemaining,
        status: 'active'
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
  handler: extendRoundHandler
});
