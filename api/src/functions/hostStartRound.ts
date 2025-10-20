/**
 * POST /api/host/startRound
 * 
 * Create or update a pending round by selecting a random incomplete goal.
 * Host-only endpoint - requires valid hostKey for authentication.
 * 
 * NEW WORKFLOW (v1.4.0):
 * - Creates round in 'pending' status (no endTime yet)
 * - If pending round exists, UPDATES it with new random goal (skip workflow)
 * - Host previews goal, then calls publishRound to make it active
 * - Fixes Bug #14: No more "entity already exists" errors when skipping
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
  successResponse,
  errorResponse,
  handleError
} from '../../shared/validation';
import { validateHostAuth } from '../../shared/host-auth';

async function startRoundHandler(
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
    context.log(`startRound: gameId=${gameId}`);

    // Get game data
    const game = await Storage.games.getGame(gameId);

    // Check if there's already an ACTIVE round (not pending)
    const existingActiveRound = await Storage.rounds.getActiveRound(gameId);
    if (existingActiveRound) {
      return errorResponse(
        'An active round is already in progress. End it before starting a new one.',
        'ROUND_ALREADY_ACTIVE',
        400,
        { currentRoundId: existingActiveRound.roundId }
      );
    }

    // Check if all goals have been completed
    if (game.board.completedGoalIndices.length >= game.board.allGoals.length) {
      return errorResponse(
        'All goals exhausted. This game has completed all 17 rounds. Please create a new game.',
        'ALL_GOALS_EXHAUSTED',
        400,
        {
          goalsCompleted: game.board.completedGoalIndices.length,
          totalRoundsPlayed: game.board.completedGoalIndices.length
        }
      );
    }

    // Check if there's a pending round (for skip workflow)
    const existingPendingRound = await Storage.rounds.getPendingRound(gameId);
    
    // Select random incomplete goal
    const completedSet = new Set(game.board.completedGoalIndices);
    const availableGoalIndices: number[] = [];
    
    for (let i = 0; i < game.board.allGoals.length; i++) {
      if (!completedSet.has(i)) {
        availableGoalIndices.push(i);
      }
    }

    if (availableGoalIndices.length === 0) {
      // Safety check - shouldn't happen if check above works
      return errorResponse(
        'No available goals remaining.',
        'NO_GOALS_AVAILABLE',
        400
      );
    }

    // Randomly select from available goals
    const randomIndex = Math.floor(Math.random() * availableGoalIndices.length);
    const selectedGoalIndex = availableGoalIndices[randomIndex];
    const selectedGoal = game.board.allGoals[selectedGoalIndex];

    context.log(`Selected goal index ${selectedGoalIndex}: ${selectedGoal.color} at (${selectedGoal.position.x}, ${selectedGoal.position.y})`);

    let roundNumber: number;
    let roundId: string;
    let isUpdate = false;
    let previousGoalIndex: number | undefined;

    if (existingPendingRound) {
      // SKIP WORKFLOW: Update existing pending round with new goal
      roundNumber = existingPendingRound.roundNumber;
      roundId = existingPendingRound.roundId;
      previousGoalIndex = existingPendingRound.goalIndex;
      isUpdate = true;

      context.log(`Updating existing pending round ${roundId} with new goal (skip workflow)`);
    } else {
      // NEW ROUND: Calculate round number and ID
      roundNumber = game.board.completedGoalIndices.length + 1;
      roundId = `${gameId}_round${roundNumber}`;

      context.log(`Creating new pending round ${roundId}`);
    }

    // Upsert pending round (create or update)
    const round = await Storage.rounds.upsertPendingRound(
      gameId,
      roundId,
      {
        roundNumber,
        goalIndex: selectedGoalIndex,
        goal: selectedGoal,
        robotPositions: game.board.robots,
        createdBy: 'host'
      }
    );

    // Prepare response message
    const message = isUpdate
      ? 'Goal updated. Review the new goal and click \'Publish\' to make it available to players, or \'Skip\' to try another goal.'
      : 'Round created in preview mode. Review the goal and click \'Publish\' to make it available to players, or \'Skip\' to try a different goal.';

    // Return success with round details
    return successResponse({
      message,
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      goalIndex: selectedGoalIndex,
      goalColor: round.goal.color,
      goalPosition: round.goal.position,
      robots: round.robotPositions,
      status: 'pending',
      goalsCompleted: game.board.completedGoalIndices.length,
      goalsRemaining: game.board.allGoals.length - game.board.completedGoalIndices.length,
      isUpdate,
      ...(isUpdate && { previousGoalIndex })
    });

  } catch (error: any) {
    context.error('startRound error:', error);
    return handleError(error);
  }
}

app.http('startRound', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'host/startRound',
  handler: startRoundHandler
});
