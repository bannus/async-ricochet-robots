/**
 * Game Controller Module
 * Handles player input, local puzzle solving, and solution building
 */

import type { Position, Robots, Walls, Move, Goal } from '../../shared/types.js';
import { moveRobot } from '../../shared/game-engine.js';
import { validateSolution } from '../../shared/solution-validator.js';
import { GameRenderer } from './game-renderer.js';
import { ApiClient } from './api-client.js';

interface Puzzle {
  walls: Walls;
  robots: Robots;
  allGoals: Goal[];
  goalPosition: Position;
  goalColor: string;
}

export class GameController {
  private renderer: GameRenderer;
  private apiClient: ApiClient;
  
  private puzzle: Puzzle | null = null;
  private initialRobots: Robots | null = null;
  private currentState: Robots | null = null;
  private moveHistory: Move[] = [];
  private selectedRobot: string | null = null;
  private goalIndex: number = 0;
  
  public gameId: string = '';
  public roundId: string = '';

  constructor(renderer: GameRenderer, apiClient: ApiClient) {
    this.renderer = renderer;
    this.apiClient = apiClient;
    
    this.setupKeyboardControls();
    this.setupMouseControls();
  }

  /**
   * Load a new puzzle and reset state
   */
  loadPuzzle(puzzle: Puzzle, goalIndex: number): void {
    this.puzzle = puzzle;
    this.initialRobots = this.deepCloneRobots(puzzle.robots);
    this.currentState = this.deepCloneRobots(puzzle.robots);
    this.moveHistory = [];
    this.goalIndex = goalIndex;
    this.selectedRobot = null;
    
    this.render();
    this.updateUI();
  }

  /**
   * Setup keyboard event listeners
   */
  private setupKeyboardControls(): void {
    document.addEventListener('keydown', (e) => {
      // Robot selection: R, Y, G, B keys
      const robotKeys: { [key: string]: string } = {
        'r': 'red',
        'y': 'yellow',
        'g': 'green',
        'b': 'blue'
      };
      
      const key = e.key.toLowerCase();
      if (robotKeys[key]) {
        this.selectRobot(robotKeys[key]);
        return;
      }
      
      // Movement: Arrow keys
      if (!this.selectedRobot) return;
      
      const directions: { [key: string]: 'up' | 'down' | 'left' | 'right' } = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      };
      
      if (directions[e.key]) {
        e.preventDefault();
        this.move(this.selectedRobot, directions[e.key]);
      }
      
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
    });
  }

  /**
   * Setup mouse event listeners for robot selection
   */
  private setupMouseControls(): void {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.addEventListener('click', (e) => {
      if (!this.currentState) return;
      
      const pos = this.renderer.getCellFromPoint(e.clientX, e.clientY);
      
      // Check if clicked on a robot
      for (const [color, robotPos] of Object.entries(this.currentState)) {
        if (robotPos.x === pos.x && robotPos.y === pos.y) {
          this.selectRobot(color);
          return;
        }
      }
    });
  }

  /**
   * Select a robot for movement
   */
  selectRobot(color: string): void {
    this.selectedRobot = color;
    this.updateUI();
    this.render();
  }

  /**
   * Move the selected robot in a direction
   */
  async move(robotColor: string, direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    if (!this.puzzle || !this.currentState) return;
    
    const beforePos = { ...this.currentState[robotColor as keyof Robots] };
    
    // Calculate new position using game engine
    const newPos = moveRobot(
      this.currentState,
      this.puzzle.walls,
      robotColor as keyof Robots,
      direction
    );
    
    // Check if robot actually moved
    const moved = (beforePos.x !== newPos.x || beforePos.y !== newPos.y);
    
    if (moved) {
      // Add to move history
      this.moveHistory.push({ 
        robot: robotColor as 'red' | 'yellow' | 'green' | 'blue',
        direction 
      });
      
      // Animate the move
      await this.renderer.animateMove(
        robotColor,
        beforePos,
        newPos,
        {
          walls: this.puzzle.walls,
          robots: this.currentState,
          allGoals: this.puzzle.allGoals
        },
        this.goalIndex,
        300
      );
      
      // Update current state
      this.currentState[robotColor as keyof Robots] = newPos;
      
      // Check if goal reached
      this.checkGoalReached();
      
      // Update UI
      this.updateUI();
    }
  }

  /**
   * Undo the last move
   */
  undo(): void {
    if (this.moveHistory.length === 0 || !this.initialRobots || !this.puzzle) return;
    
    // Remove last move
    this.moveHistory.pop();
    
    // Replay all remaining moves from initial state
    this.currentState = this.deepCloneRobots(this.initialRobots);
    
    for (const move of this.moveHistory) {
      const newPos = moveRobot(
        this.currentState,
        this.puzzle.walls,
        move.robot,
        move.direction
      );
      this.currentState[move.robot] = newPos;
    }
    
    this.render();
    this.updateUI();
    this.checkGoalReached();
  }

  /**
   * Reset to initial puzzle state
   */
  reset(): void {
    if (!this.initialRobots) return;
    
    this.currentState = this.deepCloneRobots(this.initialRobots);
    this.moveHistory = [];
    
    this.render();
    this.updateUI();
    this.clearGoalStatus();
  }

  /**
   * Check if the current state has reached the goal
   */
  private checkGoalReached(): void {
    if (!this.puzzle || !this.initialRobots || !this.currentState) return;
    
    const goal: Goal = {
      position: this.puzzle.goalPosition,
      color: this.puzzle.goalColor as 'red' | 'yellow' | 'green' | 'blue' | 'multi'
    };
    
    const validation = validateSolution(
      this.initialRobots,
      this.puzzle.walls,
      this.moveHistory,
      goal
    );
    
    if (validation.valid && validation.winningRobot) {
      this.showGoalReached(validation.winningRobot, this.moveHistory.length);
    } else {
      this.clearGoalStatus();
    }
  }

  /**
   * Show goal reached message
   */
  private showGoalReached(winningRobot: string, moveCount: number): void {
    const statusElement = document.getElementById('goal-status');
    const submitButton = document.getElementById('submit-btn') as HTMLButtonElement;
    
    if (statusElement) {
      statusElement.textContent = `Goal reached! ${moveCount} moves using ${winningRobot} robot.`;
      statusElement.className = 'success';
    }
    
    if (submitButton) {
      submitButton.disabled = false;
    }
  }

  /**
   * Clear goal status message
   */
  private clearGoalStatus(): void {
    const statusElement = document.getElementById('goal-status');
    const submitButton = document.getElementById('submit-btn') as HTMLButtonElement;
    
    if (statusElement) {
      statusElement.textContent = '';
      statusElement.className = '';
    }
    
    if (submitButton) {
      submitButton.disabled = true;
    }
  }

  /**
   * Submit the current solution to the server
   */
  async submitSolution(playerName: string): Promise<any> {
    if (!this.puzzle || this.moveHistory.length === 0) {
      throw new Error('No solution to submit');
    }
    
    return await this.apiClient.submitSolution(
      this.gameId,
      this.roundId,
      playerName,
      this.moveHistory
    );
  }

  /**
   * Render the current game state
   */
  private render(): void {
    if (!this.puzzle || !this.currentState) return;
    
    this.renderer.render(
      {
        walls: this.puzzle.walls,
        robots: this.currentState,
        allGoals: this.puzzle.allGoals
      },
      this.goalIndex
    );
    
    // Highlight selected robot
    if (this.selectedRobot) {
      this.renderer.highlightRobot(this.selectedRobot, this.currentState);
    }
  }

  /**
   * Update UI elements (move counter, history, buttons)
   */
  updateUI(): void {
    // Update move counter
    const moveCountElement = document.getElementById('move-count');
    if (moveCountElement) {
      moveCountElement.textContent = this.moveHistory.length.toString();
    }
    
    // Update selected robot indicators
    const indicators = document.querySelectorAll('.robot-selector');
    indicators.forEach(indicator => {
      const button = indicator as HTMLButtonElement;
      button.classList.toggle('selected', 
        button.dataset.robot === this.selectedRobot);
    });
    
    // Update move history list
    this.updateMoveHistoryUI();
  }

  /**
   * Update the move history display
   */
  private updateMoveHistoryUI(): void {
    const list = document.getElementById('move-history');
    if (!list) return;
    
    list.innerHTML = '';
    
    this.moveHistory.forEach((move, index) => {
      const item = document.createElement('li');
      item.textContent = `${index + 1}. ${move.robot} → ${move.direction}`;
      list.appendChild(item);
    });
  }

  /**
   * Deep clone robots object
   */
  private deepCloneRobots(robots: Robots): Robots {
    return {
      red: { ...robots.red },
      yellow: { ...robots.yellow },
      green: { ...robots.green },
      blue: { ...robots.blue }
    };
  }

  /**
   * Get current move count
   */
  getMoveCount(): number {
    return this.moveHistory.length;
  }

  /**
   * Get move history
   */
  getMoveHistory(): Move[] {
    return [...this.moveHistory];
  }

  /**
   * Check if a solution is ready to submit
   */
  canSubmit(): boolean {
    return this.moveHistory.length > 0;
  }
}
