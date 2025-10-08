/**
 * POST /api/submitSolution
 * 
 * Submit a solution for validation and scoring.
 * Validates the solution using the game engine, prevents duplicates,
 * and calculates the player's rank among all submissions.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../shared/storage';
import {
  validateSubmitSolutionRequest,
  successResponse,
  errorResponse,
  handleError,
  ValidationException
} from '../shared/validation';
import { validateSolution } from '../lib-shared/solution-validator';

export async function submitSolution(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Parse and validate request body
    const body = await request.json() as any;
    validateSubmitSolutionRequest(body);

    const { gameId, roundId, playerName, solutionData } = body;

    context.log(`submitSolution: gameId=${gameId}, roundId=${roundId}, player=${playerName}`);

    // Get game and round
    const game = await Storage.games.getGame(gameId);
    const round = await Storage.rounds.getRound(gameId, roundId);

    // Check if round is still active
    if (round.status !== 'active') {
      return errorResponse(
        'This round has ended. Solutions can no longer be submitted.',
        'ROUND_ENDED',
        400
      );
    }

    // Check if round deadline has passed
    if (Date.now() > round.endTime) {
      return errorResponse(
        'The deadline for this round has passed.',
        'DEADLINE_PASSED',
        400
      );
    }

    // Validate solution using game engine
    const validationResult = validateSolution(
      round.robotPositions,  // initialRobots
      game.board.walls,      // walls
      solutionData,          // moves
      round.goal             // goal
    );

    if (!validationResult.valid) {
      return errorResponse(
        `Invalid solution: ${validationResult.reason || 'Solution does not reach the goal'}`,
        'INVALID_SOLUTION',
        400
      );
    }

    // Solution is valid! Store it
    const solution = await Storage.solutions.submitSolution(
      gameId,
      roundId,
      playerName,
      {
        displayName: playerName,
        moveCount: solutionData.length,  // Move count is the array length
        winningRobot: validationResult.winningRobot!,
        moves: solutionData
      }
    );

    // Get player's submission count
    const playerSubmissionCount = await Storage.solutions.getPlayerSubmissionCount(
      gameId,
      roundId,
      playerName
    );

    context.log(`Solution accepted: ${playerName} - ${solution.moveCount} moves (submission #${playerSubmissionCount})`);

    // Calculate rank among ALL submissions
    const allSolutions = await Storage.solutions.getLeaderboard(gameId, roundId);
    
    // Find rank of this specific submission
    let rank = 1;
    for (let i = 0; i < allSolutions.length; i++) {
      // Update rank when move count increases
      if (i > 0 && allSolutions[i].moveCount > allSolutions[i - 1].moveCount) {
        rank = i + 1;
      }
      
      // Check if this is the current submission
      if (allSolutions[i].submittedAt === solution.submittedAt &&
          allSolutions[i].playerName === playerName.toLowerCase().trim()) {
        break;
      }
    }

    // Return success with submission information
    return successResponse({
      message: `Solution #${playerSubmissionCount} submitted successfully!`,
      solution: {
        playerName,
        moveCount: solution.moveCount,
        winningRobot: solution.winningRobot,
        submittedAt: solution.submittedAt,
        submissionNumber: playerSubmissionCount,
        rank,
        totalSolutions: allSolutions.length
      },
      leaderboard: {
        yourRank: rank,
        totalSubmissions: allSolutions.length,
        topScore: allSolutions[0]?.moveCount,
        yourScore: solution.moveCount,
        yourSubmissionCount: playerSubmissionCount,
        ...(rank === 1 && {
          achievement: 'Current leader! 🏆'
        }),
        ...(rank <= 3 && rank > 1 && {
          achievement: `Top ${rank}! 🎯`
        })
      }
    });

  } catch (error: any) {
    context.error('submitSolution error:', error);
    return handleError(error);
  }
}

app.http('submitSolution', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: submitSolution
});
