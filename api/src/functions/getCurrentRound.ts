/**
 * GET /api/getCurrentRound
 * 
 * Get the current active round for a game, including persistent board state.
 * Returns different responses based on game state (active round, waiting, or complete).
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
  validateGetCurrentRoundQuery,
  successResponse,
  errorResponse,
  handleError
} from '../../shared/validation';

async function getCurrentRoundHandler(
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

    // Get active round, or pending round if no active round exists
    let currentRound = await Storage.rounds.getActiveRound(gameId);
    
    if (!currentRound) {
      // Try to get pending round (for host preview)
      currentRound = await Storage.rounds.getPendingRound(gameId);
    }

    if (!currentRound) {
      // No active or pending round - find the most recently completed round
      const allRounds = await Storage.rounds.getAllRounds(gameId);
      const completedRounds = allRounds.filter(r => r.status === 'completed');
      const lastCompletedRound = completedRounds.length > 0 
        ? completedRounds[completedRounds.length - 1] 
        : null;

      // If we have a completed round, return its full data for replay
      if (lastCompletedRound) {
        return successResponse({
          gameId: game.gameId,
          gameName: game.gameName,
          roundId: lastCompletedRound.roundId,
          roundNumber: lastCompletedRound.roundNumber,
          puzzle: {
            walls: game.board.walls,
            robots: lastCompletedRound.robotPositions, // Starting positions for that round
            allGoals: game.board.allGoals,
            goalColor: lastCompletedRound.goal.color,
            goalPosition: lastCompletedRound.goal.position,
            completedGoalIndices: game.board.completedGoalIndices
          },
          startTime: lastCompletedRound.startTime,
          endTime: lastCompletedRound.endTime,
          status: 'completed',
          hasActiveRound: false,
          goalsCompleted: game.board.completedGoalIndices.length,
          goalsRemaining: 17 - game.board.completedGoalIndices.length,
          message: 'Round complete - waiting for next round'
        });
      }

      // No rounds at all yet
      return successResponse({
        gameId: game.gameId,
        gameName: game.gameName,
        hasActiveRound: false,
        message: 'No active round. Waiting for host to start next round.',
        goalsCompleted: game.board.completedGoalIndices.length,
        goalsRemaining: 17 - game.board.completedGoalIndices.length
      });
    }

    // Current round exists (active or pending) - return full puzzle data
    return successResponse({
      gameId: game.gameId,
      gameName: game.gameName,
      roundId: currentRound.roundId,
      roundNumber: currentRound.roundNumber,
      puzzle: {
        walls: game.board.walls,
        robots: game.board.robots,
        allGoals: game.board.allGoals,
        goalColor: currentRound.goal.color,
        goalPosition: currentRound.goal.position,
        completedGoalIndices: game.board.completedGoalIndices
      },
      startTime: currentRound.startTime,
      endTime: currentRound.endTime,
      status: currentRound.status,
      hasActiveRound: currentRound.status === 'active',
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
  handler: getCurrentRoundHandler
});
