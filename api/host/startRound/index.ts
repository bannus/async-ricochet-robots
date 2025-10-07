/**
 * POST /api/host/startRound
 * 
 * Start a new round by selecting the next goal.
 * Host-only endpoint - requires valid hostKey for authentication.
 * Selects next uncompleted goal and creates an active round.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
  validateStartRoundRequest,
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

export async function startRound(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Parse and validate request body
    const body = await request.json() as any;
    validateStartRoundRequest(body);

    const { gameId, hostKey, customDurationMs } = body;

    context.log(`startRound: gameId=${gameId}`);

    // Authenticate host
    const isAuthenticated = await authenticateHost(gameId, hostKey);
    if (!isAuthenticated) {
      return errorResponse(
        'Invalid host key. Only the game host can start rounds.',
        'UNAUTHORIZED',
        401
      );
    }

    // Get game data
    const game = await Storage.games.getGame(gameId);

    // Check if there's already an active round
    const existingRound = await Storage.rounds.getActiveRound(gameId);
    if (existingRound) {
      return errorResponse(
        'A round is already in progress. End the current round before starting a new one.',
        'ROUND_IN_PROGRESS',
        409
      );
    }

    // Check if all goals have been completed
    if (game.board.completedGoalIndices.length >= game.board.allGoals.length) {
      return errorResponse(
        'All goals have been completed! This game is finished.',
        'GAME_COMPLETE',
        400
      );
    }

    // Select next goal (first uncompleted goal)
    const completedSet = new Set(game.board.completedGoalIndices);
    let nextGoalIndex = -1;
    
    for (let i = 0; i < game.board.allGoals.length; i++) {
      if (!completedSet.has(i)) {
        nextGoalIndex = i;
        break;
      }
    }

    if (nextGoalIndex === -1) {
      // This shouldn't happen if the check above works, but safety check
      return errorResponse(
        'No available goals remaining.',
        'NO_GOALS_AVAILABLE',
        400
      );
    }

    const selectedGoal = game.board.allGoals[nextGoalIndex];

    context.log(`Selected goal index ${nextGoalIndex}: ${selectedGoal.color} at (${selectedGoal.position.x}, ${selectedGoal.position.y})`);

    // Determine round duration
    const durationMs = customDurationMs || game.defaultRoundDurationMs;
    const startTime = Date.now();
    const endTime = startTime + durationMs;

    // Calculate round number (total completed + 1)
    const roundNumber = game.board.completedGoalIndices.length + 1;

    // Generate round ID
    const roundId = `${gameId}_round${roundNumber}`;

    // Create round in storage
    const round = await Storage.rounds.createRound(
      gameId,
      roundId,
      {
        roundNumber,
        goalIndex: nextGoalIndex,
        goal: selectedGoal,
        robotPositions: game.board.robots,
        startTime,
        endTime,
        durationMs,
        createdBy: 'host'
      }
    );

    context.log(`Round ${roundNumber} created: roundId=${round.roundId}`);

    // Return success with round details
    return successResponse({
      message: 'Round started successfully!',
      round: {
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        gameId: round.gameId,
        goal: {
          color: round.goal.color,
          position: round.goal.position
        },
        robotPositions: round.robotPositions,
        startTime: round.startTime,
        endTime: round.endTime,
        durationMs: durationMs,
        status: 'active'
      },
      gameProgress: {
        roundsCompleted: game.board.completedGoalIndices.length,
        totalGoals: game.board.allGoals.length,
        roundsRemaining: game.board.allGoals.length - game.board.completedGoalIndices.length - 1 // -1 for current round
      },
      nextSteps: [
        'Players can now view the round and submit solutions',
        'Monitor the leaderboard to see submissions',
        'End the round when time expires or when ready'
      ]
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
  handler: startRound
});
