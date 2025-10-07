/**
 * Azure Timer Function: checkRoundEnd
 * 
 * Automatically ends rounds that have passed their deadline.
 * Runs every 5 minutes to check for expired active rounds.
 * Mimics the manual endRound process but triggered by timer.
 */

import { app, InvocationContext, Timer } from '@azure/functions';
import { Storage } from '../shared/storage';
import { applyMoves } from '../lib-shared/game-engine';

export async function checkRoundEnd(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const currentTime = Date.now();
  
  context.log(`checkRoundEnd triggered at ${new Date(currentTime).toISOString()}`);

  try {
    // Get all expired active rounds
    const expiredRounds = await Storage.rounds.getExpiredRounds(currentTime);

    if (expiredRounds.length === 0) {
      context.log('No expired rounds found');
      return;
    }

    context.log(`Found ${expiredRounds.length} expired round(s) to process`);

    // Process each expired round
    for (const round of expiredRounds) {
      try {
        context.log(`Processing expired round: ${round.roundId} (game: ${round.gameId})`);

        // Get game data
        const game = await Storage.games.getGame(round.gameId);

        // Get all solutions for this round
        const solutions = await Storage.solutions.getLeaderboard(round.gameId, round.roundId);

        context.log(`  Round ${round.roundId}: ${solutions.length} solution(s) submitted`);

        // Determine winning solution (if any)
        let winningSolution = null;
        let newRobotPositions = game.board.robots;

        if (solutions.length > 0) {
          winningSolution = solutions[0]; // Already sorted
          context.log(`  Winner: ${winningSolution.playerName} with ${winningSolution.moveCount} moves`);

          // Apply winning solution's moves to update robot positions
          newRobotPositions = applyMoves(
            round.robotPositions,
            game.board.walls,
            winningSolution.moves
          );
        } else {
          context.log(`  No solutions submitted - robot positions unchanged`);
        }

        // Mark round as completed
        await Storage.rounds.updateRound(round.gameId, round.roundId, {
          status: 'completed',
          endTime: currentTime // Update to actual end time
        });

        // Update game: mark goal as completed and update robot positions
        const updatedCompletedGoalIndices = [
          ...game.board.completedGoalIndices,
          round.goalIndex
        ];

        await Storage.games.updateGame(round.gameId, {
          board: {
            ...game.board,
            robots: newRobotPositions,
            completedGoalIndices: updatedCompletedGoalIndices
          },
          totalRounds: game.totalRounds + 1
        });

        context.log(`  Round ${round.roundId} completed successfully`);
        context.log(`  Game progress: ${updatedCompletedGoalIndices.length}/${game.board.allGoals.length} goals`);

      } catch (error: any) {
        context.error(`Error processing round ${round.roundId}:`, error);
        // Continue processing other rounds even if one fails
      }
    }

    context.log(`checkRoundEnd completed: processed ${expiredRounds.length} round(s)`);

  } catch (error: any) {
    context.error('checkRoundEnd error:', error);
    throw error; // Re-throw to mark function as failed in Azure
  }
}

// Timer trigger: runs every 5 minutes
// NCRONTAB expression: "0 */5 * * * *" = At second 0, every 5 minutes
app.timer('checkRoundEnd', {
  schedule: '0 */5 * * * *',
  handler: checkRoundEnd
});
