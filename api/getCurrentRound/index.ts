/**
 * GET /api/getCurrentRound
 * 
 * Get the current active round for a game, including persistent board state.
 * Returns different responses based on game state (active round, waiting, or complete).
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../shared/storage';
import {
  validateGetCurrentRoundQuery,
  successResponse,
  errorResponse,
  handleError
} from '../shared/validation';

export async function getCurrentRound(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Extract and validate query parameters
    const query = {
      gameId: request.query.get('gameId')
    };

    validateGetCurrentRoundQuery(query);
    const gameId = query.gameId!;

    context.log(`getCurrentRound: gameId=${gameId}`);

    // Get game from storage
    const game = await Storage.games.getGame(gameId);

    // Check if game has completed all 17 goals
    if (game.board.completedGoalIndices.length >= 17) {
      return successResponse({
        gameId: game.gameId,
        gameName: game.gameName,
        hasActiveRound: false,
        gameComplete: true,
        message: 'This game has completed all 17 rounds!',
        totalRoundsPlayed: game.totalRounds,
        goalsCompleted: 17
      });
    }

    // Get active round (if exists)
    const activeRound = await Storage.rounds.getActiveRound(gameId);

    if (!activeRound) {
      // No active round - waiting for host to start
      return successResponse({
        gameId: game.gameId,
        gameName: game.gameName,
        hasActiveRound: false,
        message: 'No active round. Waiting for host to start next round.',
        lastRoundId: game.currentRoundId || undefined,
        goalsCompleted: game.board.completedGoalIndices.length,
        goalsRemaining: 17 - game.board.completedGoalIndices.length
      });
    }

    // Active round exists - return full puzzle data
    return successResponse({
      gameId: game.gameId,
      gameName: game.gameName,
      roundId: activeRound.roundId,
      roundNumber: activeRound.roundNumber,
      puzzle: {
        walls: game.board.walls,
        robots: game.board.robots,
        allGoals: game.board.allGoals,
        goalColor: activeRound.goal.color,
        goalPosition: activeRound.goal.position,
        completedGoalIndices: game.board.completedGoalIndices
      },
      startTime: activeRound.startTime,
      endTime: activeRound.endTime,
      durationMs: activeRound.durationMs,
      status: activeRound.status,
      goalsRemaining: 17 - game.board.completedGoalIndices.length
    });

  } catch (error: any) {
    context.error('getCurrentRound error:', error);
    return handleError(error);
  }
}

app.http('getCurrentRound', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getCurrentRound
});
