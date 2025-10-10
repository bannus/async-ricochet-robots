/**
 * POST /api/host/endRound
 * 
 * End the current round and finalize results.
 * Host-only endpoint - requires valid hostKey for authentication.
 * Marks round as completed, updates robot positions from winning solution,
 * and marks the goal as completed in the game.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
  validateEndRoundRequest,
  successResponse,
  errorResponse,
  handleError
} from '../../shared/validation';
import { validateHostAuth } from '../../shared/host-auth';
import { applyMoves } from '../../lib-shared/game-engine';

async function endRoundHandler(
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
    validateEndRoundRequest(body);

    const { roundId, skipGoal } = body;

    context.log(`endRound: gameId=${gameId}, roundId=${roundId}, skipGoal=${skipGoal || false}`);

    // Get game and round data
    const game = await Storage.games.getGame(gameId);
    const round = await Storage.rounds.getRound(gameId, roundId);

    // Check if round is still active
    if (round.status !== 'active') {
      return errorResponse(
        `This round has already ended with status: ${round.status}`,
        'ROUND_ALREADY_ENDED',
        400
      );
    }

    // Get all solutions for this round
    const solutions = await Storage.solutions.getLeaderboard(gameId, roundId);

    context.log(`Found ${solutions.length} solutions for round ${roundId}`);

    // Determine winning solution (best moveCount, earliest submission)
    let winningSolution = null;
    if (solutions.length > 0) {
      // Solutions are already sorted by moveCount then submittedAt
      winningSolution = solutions[0];
      context.log(`Winning solution: ${winningSolution.playerName} with ${winningSolution.moveCount} moves`);
    }

    // Update robot positions if there's a winning solution
    let newRobotPositions = game.board.robots;
    if (winningSolution) {
      // Apply winning solution's moves to get final robot positions
      newRobotPositions = applyMoves(
        round.robotPositions,
        game.board.walls,
        winningSolution.moves
      );
      context.log('Updated robot positions from winning solution');
    } else {
      context.log('No solutions submitted - robot positions unchanged');
    }

    // Mark round as completed
    await Storage.rounds.updateRound(gameId, roundId, {
      status: 'completed',
      endTime: Date.now() // Update to actual end time
    });

    // Update game: mark goal as completed and update robot positions
    const updatedCompletedGoalIndices = [
      ...game.board.completedGoalIndices,
      round.goalIndex
    ];

    await Storage.games.updateGame(gameId, {
      board: {
        ...game.board,
        robots: newRobotPositions,
        completedGoalIndices: updatedCompletedGoalIndices
      },
      totalRounds: game.totalRounds + 1
    });

    context.log(`Round ${roundId} ended successfully`);

    // Prepare leaderboard with ranks
    const rankedSolutions = solutions.map((solution, index) => {
      // Calculate rank (handle ties)
      let rank = 1;
      for (let i = 0; i < index; i++) {
        if (solutions[i].moveCount < solution.moveCount) {
          rank = i + 2;
          break;
        }
      }
      if (rank === 1 && index > 0) {
        // Check if tied with previous
        if (solutions[index - 1].moveCount === solution.moveCount) {
          rank = 1; // Still rank 1 if tied
        } else {
          rank = index + 1;
        }
      } else if (index > 0) {
        // Find actual rank considering all previous solutions
        let currentRank = 1;
        for (let i = 0; i < solutions.length; i++) {
          if (i > 0 && solutions[i].moveCount > solutions[i - 1].moveCount) {
            currentRank = i + 1;
          }
          if (i === index) {
            rank = currentRank;
            break;
          }
        }
      }

      return {
        rank,
        playerName: solution.displayName,
        moveCount: solution.moveCount,
        winningRobot: solution.winningRobot,
        submittedAt: solution.submittedAt,
        moves: solution.moves
      };
    });

    // Return success with final results
    return successResponse({
      message: winningSolution
        ? `Round ended! Winner: ${winningSolution.displayName} with ${winningSolution.moveCount} moves.`
        : 'Round ended with no solutions submitted.',
      round: {
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        gameId: round.gameId,
        goal: round.goal,
        status: 'completed',
        finalizedAt: Date.now()
      },
      winner: winningSolution ? {
        playerName: winningSolution.displayName,
        moveCount: winningSolution.moveCount,
        winningRobot: winningSolution.winningRobot,
        submittedAt: winningSolution.submittedAt
      } : null,
      leaderboard: {
        totalSolutions: solutions.length,
        solutions: rankedSolutions
      },
      gameProgress: {
        roundsCompleted: updatedCompletedGoalIndices.length,
        totalGoals: game.board.allGoals.length,
        roundsRemaining: game.board.allGoals.length - updatedCompletedGoalIndices.length,
        gameComplete: updatedCompletedGoalIndices.length >= game.board.allGoals.length
      },
      updatedRobotPositions: newRobotPositions,
      nextSteps: updatedCompletedGoalIndices.length >= game.board.allGoals.length
        ? ['Game complete! All goals have been solved.', 'View final statistics on the dashboard']
        : ['Start the next round when ready', 'Robot positions have been updated for the next round']
    });

  } catch (error: any) {
    context.error('endRound error:', error);
    return handleError(error);
  }
}

app.http('endRound', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'host/endRound',
  handler: endRoundHandler
});
