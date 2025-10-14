/**
 * Replay Controller Module
 * Orchestrates solution replay with animations and pauses
 */

import type { Robots, Move, Walls, Goal } from '../../shared/types.js';
import { moveRobot } from '../../shared/game-engine.js';
import { GameRenderer } from './game-renderer.js';

interface Solution {
  playerName: string;
  moveCount: number;
  winningRobot: string;
  moves: Move[];
}

interface Puzzle {
  walls: Walls;
  robots: Robots;
  allGoals: Goal[];
}

export class ReplayController {
  private isPlaying: boolean = false;
  private currentMoveIndex: number = 0;
  
  constructor(private renderer: GameRenderer) {}

  /**
   * Replay a complete solution with animations
   */
  async replaySolution(
    solution: Solution,
    puzzle: Puzzle,
    startingPositions: Robots,
    activeGoalIndex: number
  ): Promise<void> {
    this.isPlaying = true;
    this.currentMoveIndex = 0;
    
    // Clone starting positions
    let currentPositions: Robots = JSON.parse(JSON.stringify(startingPositions));
    
    // Replay each move
    for (let i = 0; i < solution.moves.length && this.isPlaying; i++) {
      const move = solution.moves[i];
      this.currentMoveIndex = i + 1;
      
      // Calculate destination using game engine
      const previousPositions = { ...currentPositions };
      const newPosition = moveRobot(
        currentPositions,
        puzzle.walls,
        move.robot as keyof Robots,
        move.direction
      );
      
      // Update current positions with the new robot position
      currentPositions = {
        ...currentPositions,
        [move.robot]: newPosition
      };
      
      // Re-render board before animation
      this.renderer.clear();
      this.renderer.render(
        { ...puzzle, robots: previousPositions },
        activeGoalIndex
      );
      
      // Animate the move
      await this.renderer.animateMove(
        move.robot,
        previousPositions[move.robot as keyof Robots],
        currentPositions[move.robot as keyof Robots],
        { ...puzzle, robots: currentPositions },
        activeGoalIndex
      );
      
      // Re-render after animation
      this.renderer.clear();
      this.renderer.render(
        { ...puzzle, robots: currentPositions },
        activeGoalIndex
      );
      
      // Pause between moves (500ms)
      if (i < solution.moves.length - 1) {
        await this.pause(500);
      }
    }
    
    // Replay complete - stay on final state
    this.isPlaying = false;
  }

  /**
   * Stop ongoing replay
   */
  stopReplay(): void {
    this.isPlaying = false;
  }

  /**
   * Pause for specified milliseconds
   */
  private pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if currently replaying
   */
  isReplaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current move index
   */
  getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }
}
