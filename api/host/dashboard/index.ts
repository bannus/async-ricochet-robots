/**
 * GET /api/host/dashboard
 * 
 * Get comprehensive dashboard data for the host.
 * Shows game overview, all rounds, and statistics.
 * Host-only endpoint - requires valid hostKey for authentication.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Storage } from '../../shared/storage';
import {
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

export async function getDashboard(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Get query parameters
    const gameId = request.query.get('gameId');
    const hostKey = request.query.get('hostKey');

    // Validate required parameters
    if (!gameId) {
      return errorResponse(
        'gameId query parameter is required',
        'VALIDATION_ERROR',
        400
      );
    }

    if (!hostKey) {
      return errorResponse(
        'hostKey query parameter is required',
        'VALIDATION_ERROR',
        400
      );
    }

    context.log(`getDashboard: gameId=${gameId}`);

    // Authenticate host
    const isAuthenticated = await authenticateHost(gameId, hostKey);
    if (!isAuthenticated) {
      return errorResponse(
        'Invalid host key. Only the game host can access the dashboard.',
        'UNAUTHORIZED',
        401
      );
    }

    // Get game data
    const game = await Storage.games.getGame(gameId);

    // Get all rounds for this game
    const allRounds = await Storage.rounds.getAllRounds(gameId);

    context.log(`Found ${allRounds.length} rounds for game ${gameId}`);

    // Build rounds summary with solution counts
    const roundsSummary = await Promise.all(
      allRounds.map(async (round) => {
        const solutions = await Storage.solutions.getLeaderboard(gameId, round.roundId);
        
        return {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          goal: round.goal,
          status: round.status,
          startTime: round.startTime,
          endTime: round.endTime,
          durationMs: round.durationMs,
          solutionCount: solutions.length,
          winner: solutions.length > 0 ? {
            playerName: solutions[0].displayName,
            moveCount: solutions[0].moveCount,
            submittedAt: solutions[0].submittedAt
          } : null,
          createdBy: round.createdBy
        };
      })
    );

    // Calculate statistics
    const activeRound = roundsSummary.find(r => r.status === 'active');
    const completedRounds = roundsSummary.filter(r => r.status === 'completed');
    const skippedRounds = roundsSummary.filter(r => r.status === 'skipped');

    const totalSolutions = roundsSummary.reduce((sum, r) => sum + r.solutionCount, 0);
    const avgSolutionsPerRound = completedRounds.length > 0
      ? Math.round(totalSolutions / completedRounds.length * 10) / 10
      : 0;

    // Get unique players across all rounds
    const allPlayers = new Set<string>();
    for (const round of allRounds) {
      const solutions = await Storage.solutions.getLeaderboard(gameId, round.roundId);
      solutions.forEach(s => allPlayers.add(s.playerName));
    }

    // Calculate game progress
    const goalsCompleted = game.board.completedGoalIndices.length;
    const totalGoals = game.board.allGoals.length;
    const progressPercent = Math.round((goalsCompleted / totalGoals) * 100);
    const isGameComplete = goalsCompleted >= totalGoals;

    // Return comprehensive dashboard
    return successResponse({
      game: {
        gameId: game.gameId,
        gameName: game.gameName,
        createdAt: game.createdAt,
        defaultRoundDurationMs: game.defaultRoundDurationMs,
        totalRounds: game.totalRounds
      },
      progress: {
        goalsCompleted,
        totalGoals,
        goalsRemaining: totalGoals - goalsCompleted,
        progressPercent,
        isComplete: isGameComplete
      },
      currentState: {
        hasActiveRound: !!activeRound,
        activeRound: activeRound ? {
          roundId: activeRound.roundId,
          roundNumber: activeRound.roundNumber,
          goal: activeRound.goal,
          startTime: activeRound.startTime,
          endTime: activeRound.endTime,
          timeRemaining: Math.max(0, activeRound.endTime - Date.now()),
          solutionCount: activeRound.solutionCount,
          leader: activeRound.winner
        } : null,
        robotPositions: game.board.robots
      },
      statistics: {
        totalRoundsPlayed: allRounds.length,
        roundsCompleted: completedRounds.length,
        roundsSkipped: skippedRounds.length,
        activeRounds: activeRound ? 1 : 0,
        totalSolutions,
        averageSolutionsPerRound: avgSolutionsPerRound,
        uniquePlayers: allPlayers.size,
        participationRate: completedRounds.length > 0
          ? Math.round((totalSolutions / completedRounds.length / Math.max(1, allPlayers.size)) * 100)
          : 0
      },
      rounds: roundsSummary.sort((a, b) => b.roundNumber - a.roundNumber), // Most recent first
      nextSteps: isGameComplete
        ? ['Game complete! All goals have been solved.', 'Review final statistics', 'Archive or share results']
        : activeRound
          ? ['Monitor current round progress', 'View leaderboard', 'End round when ready or wait for timer']
          : ['Start the next round', `${totalGoals - goalsCompleted} goals remaining`]
    });

  } catch (error: any) {
    context.error('getDashboard error:', error);
    return handleError(error);
  }
}

app.http('getDashboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'host/dashboard',
  handler: getDashboard
});
