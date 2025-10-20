/**
 * POST /api/host/publishRound
 * 
 * Publish a pending round, making it active and visible to players.
 * Host-only endpoint - requires valid hostKey for authentication.
 * 
 * NEW WORKFLOW (v1.4.0):
 * - Takes a pending round and makes it active
 * - Sets the endTime (deadline) when publishing
 * - Increments game totalRounds counter
 * - Players can now see and submit solutions
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
  successResponse,
  errorResponse,
  handleError
} from '../../shared/validation';
import { validateHostAuth } from '../../shared/host-auth';

async function publishRoundHandler(
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
    context.log(`publishRound: gameId=${gameId}`);

    // Parse and validate request body
    const body = await request.json() as any;
    
    if (!body.roundId) {
      return errorResponse(
        'roundId is required',
        'VALIDATION_ERROR',
        400
      );
    }

    if (!body.endTime || typeof body.endTime !== 'number') {
      return errorResponse(
        'endTime is required and must be a number (Unix timestamp in milliseconds)',
        'VALIDATION_ERROR',
        400
      );
    }

    const { roundId, endTime } = body;

    // Get the round
    const round = await Storage.rounds.getRound(gameId, roundId);

    // Verify round is in pending status
    if (round.status !== 'pending') {
      return errorResponse(
        `Can only publish pending rounds. This round has status: ${round.status}`,
        'INVALID_ROUND_STATUS',
        400
      );
    }

    // Validate endTime is in the future
    const startTime = Date.now();
    if (endTime <= startTime) {
      return errorResponse(
        'Deadline must be in the future',
        'INVALID_DEADLINE',
        400
      );
    }

    // Update round to active status with times
    await Storage.rounds.updateRound(gameId, roundId, {
      status: 'active',
      startTime,
      endTime
    });

    // Increment game totalRounds counter
    const game = await Storage.games.getGame(gameId);
    await Storage.games.updateGame(gameId, {
      totalRounds: game.totalRounds + 1,
      currentRoundId: roundId
    });

    // Get solution count (should be 0 for newly published round)
    const solutionCount = await Storage.solutions.getSolutionCount(gameId, roundId);

    context.log(`Round ${roundId} published successfully`);

    // Return success
    return successResponse({
      message: 'Round published successfully! Players can now view and submit solutions.',
      roundId,
      roundNumber: round.roundNumber,
      goalColor: round.goal.color,
      goalPosition: round.goal.position,
      status: 'active',
      startTime,
      endTime,
      solutionCount
    });

  } catch (error: any) {
    context.error('publishRound error:', error);
    return handleError(error);
  }
}

app.http('publishRound', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'host/publishRound',
  handler: publishRoundHandler
});
