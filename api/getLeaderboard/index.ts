/**
 * GET /api/getLeaderboard
 * 
 * Get ranked leaderboard for a specific round.
 * Sorts solutions by move count (ascending), then submission time (ascending).
 * Implements proper tie-breaking: players with same move count share the same rank.
 * Hides solution data during active rounds, shows after round ends.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../shared/storage';
import {
  validateGetLeaderboardQuery,
  successResponse,
  handleError
} from '../shared/validation';

interface RankedSolution {
  rank: number;
  playerName: string;
  moveCount: number;
  winningRobot: string;
  submittedAt: number;
  moves?: Array<{ robot: string; direction: string }>;
}

export async function getLeaderboard(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Extract and validate query parameters
    const query = {
      gameId: request.query.get('gameId'),
      roundId: request.query.get('roundId')
    };

    validateGetLeaderboardQuery(query);
    const gameId = query.gameId!;
    const roundId = query.roundId!;

    context.log(`getLeaderboard: gameId=${gameId}, roundId=${roundId}`);

    // Get round to check if it's active
    const round = await Storage.rounds.getRound(gameId, roundId);

    // Get all solutions for this round
    const solutions = await Storage.solutions.getLeaderboard(gameId, roundId);

    // If no solutions yet
    if (solutions.length === 0) {
      return successResponse({
        gameId,
        roundId,
        roundNumber: round.roundNumber,
        roundStatus: round.status,
        solutions: [],
        totalSolutions: 0,
        message: 'No solutions submitted yet'
      });
    }

    // Sort solutions: first by moveCount (ascending), then by submittedAt (ascending)
    solutions.sort((a, b) => {
      if (a.moveCount !== b.moveCount) {
        return a.moveCount - b.moveCount;
      }
      return a.submittedAt - b.submittedAt;
    });

    // Assign ranks (players with same move count share the same rank)
    const rankedSolutions: RankedSolution[] = [];
    let currentRank = 1;

    for (let i = 0; i < solutions.length; i++) {
      // If this is not the first solution and move count is different from previous,
      // update rank to current position + 1
      if (i > 0 && solutions[i].moveCount > solutions[i - 1].moveCount) {
        currentRank = i + 1;
      }

      const rankedSolution: RankedSolution = {
        rank: currentRank,
        playerName: solutions[i].playerName,
        moveCount: solutions[i].moveCount,
        winningRobot: solutions[i].winningRobot,
        submittedAt: solutions[i].submittedAt
      };

      // Include solution data only if round has ended
      if (round.status !== 'active') {
        rankedSolution.moves = solutions[i].moves;
      }

      rankedSolutions.push(rankedSolution);
    }

    // Return leaderboard
    return successResponse({
      gameId,
      roundId,
      roundNumber: round.roundNumber,
      roundStatus: round.status,
      goalColor: round.goal.color,
      goalPosition: round.goal.position,
      solutions: rankedSolutions,
      totalSolutions: rankedSolutions.length,
      topScore: rankedSolutions[0].moveCount,
      ...(round.status !== 'active' && {
        endTime: round.endTime,
        finalizedAt: round.endTime
      })
    });

  } catch (error: any) {
    context.error('getLeaderboard error:', error);
    return handleError(error);
  }
}

app.http('getLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getLeaderboard
});
