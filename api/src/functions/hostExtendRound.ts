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

    const { roundId, extendByMs } = body;

    context.log(`extendRound: gameId=${gameId}, roundId=${roundId}, extendBy=${extendByMs}ms`);

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
    const newEndTime = round.endTime + extendByMs;
    const now = Date.now();

    context.log(`Current endTime: ${round.endTime}, New endTime: ${newEndTime}`);

    // Update round with new end time
    await Storage.rounds.updateRound(gameId, roundId, {
      endTime: newEndTime
    });

    const timeRemaining = newEndTime - now;
    const hoursAdded = Math.round(extendByMs / (1000 * 60 * 60) * 10) / 10;

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
        timeAdded: extendByMs,
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
  handler: extendRoundHandler
});
