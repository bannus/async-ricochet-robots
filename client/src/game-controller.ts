/**
 * Game Controller Module
 * Handles player input, local puzzle solving, and solution building
 */

// Hammer.js is loaded from assets/hammer.min.js in index.html
declare const Hammer: typeof import('hammerjs');

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
  private animationQueue: Array<{robot: string, direction: 'up' | 'down' | 'left' | 'right'}> = [];
  private isProcessingQueue: boolean = false;
  private readonly MAX_QUEUE_SIZE = 50;
  
  public gameId: string = '';
  public roundId: string = '';

  constructor(renderer: GameRenderer, apiClient: ApiClient) {
    this.renderer = renderer;
    this.apiClient = apiClient;
    
    this.setupKeyboardControls();
    this.setupHammerControls();
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
   * Setup Hammer.js controls for unified mouse and touch input
   */
  private setupHammerControls(): void {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    if (!canvas) {
      console.error('[GameController] Canvas not found!');
      return;
    }

    console.log('[GameController] Setting up Hammer controls on canvas');

    const hammer = new Hammer(canvas);
    
    // Configure swipe recognizer for all cardinal directions
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 10,      // Minimum distance in pixels
      velocity: 0.3       // Minimum velocity
    });
    
    // Swipe handler - moves selected robot (works for mouse drag and touch swipe)
    hammer.on('swipe', (e: HammerInput) => {
      console.log('[GameController] Swipe detected:', e.direction);
      if (!this.selectedRobot) return;
      
      const direction = this.getDirectionFromHammer(e.direction);
      if (direction) {
        this.move(this.selectedRobot, direction);
      }
    });
    
    // Regular click handler for desktop - more reliable than Hammer tap for mouse
    console.log('[GameController] Adding click event listener to canvas');
    canvas.addEventListener('click', (e: MouseEvent) => {
      console.log('[GameController] Click detected at', e.clientX, e.clientY);
      
      if (!this.currentState) {
        console.log('[GameController] No current state, ignoring click');
        return;
      }
      
      // Pass absolute client coordinates - getCellFromPoint handles conversion
      const pos = this.renderer.getCellFromPoint(e.clientX, e.clientY);
      console.log('[GameController] Cell position:', pos);
      
      // Check if clicked on a robot
      for (const [color, robotPos] of Object.entries(this.currentState)) {
        if (robotPos.x === pos.x && robotPos.y === pos.y) {
          console.log('[GameController] Found robot at click position:', color);
          this.selectRobot(color);
          return;
        }
      }
      
      console.log('[GameController] No robot found at click position');
    });
    
    console.log('[GameController] Hammer controls setup complete');
  }

  /**
   * Convert Hammer.js direction constant to game direction
   */
  private getDirectionFromHammer(hammerDirection: number): 'up' | 'down' | 'left' | 'right' | null {
    switch (hammerDirection) {
      case Hammer.DIRECTION_UP: return 'up';
      case Hammer.DIRECTION_DOWN: return 'down';
      case Hammer.DIRECTION_LEFT: return 'left';
      case Hammer.DIRECTION_RIGHT: return 'right';
      default: return null;
    }
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
   * Queues the move for sequential animation processing
   */
  async move(robotColor: string, direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    // Prevent queue from growing too large
    if (this.animationQueue.length >= this.MAX_QUEUE_SIZE) {
      return;
    }
    
    // Add to queue
    this.animationQueue.push({
      robot: robotColor,
      direction: direction
    });
    
    // Start processing if not already running (race condition protected)
    if (!this.isProcessingQueue) {
      this.isProcessingQueue = true;
      this.updateButtonStates(); // Disable buttons immediately
      await this.processQueue();
    }
  }

  /**
   * Process the animation queue sequentially
   */
  private async processQueue(): Promise<void> {
    // Note: isProcessingQueue already set to true by move()
    
    while (this.animationQueue.length > 0) {
      const move = this.animationQueue.shift()!;
      
      if (!this.puzzle || !this.currentState) {
        continue;
      }
      
      const beforePos = { ...this.currentState[move.robot as keyof Robots] };
      
      // Calculate new position using game engine
      const newPos = moveRobot(
        this.currentState,
        this.puzzle.walls,
        move.robot as keyof Robots,
        move.direction
      );
      
      // Check if robot actually moved
      const moved = (beforePos.x !== newPos.x || beforePos.y !== newPos.y);
      
      if (moved) {
        // Add to move history
        this.moveHistory.push({
          robot: move.robot as 'red' | 'yellow' | 'green' | 'blue',
          direction: move.direction
        });
        
        // Animate the move
        await this.renderer.animateMove(
          move.robot,
          beforePos,
          newPos,
          {
            walls: this.puzzle.walls,
            robots: this.currentState,
            allGoals: this.puzzle.allGoals
          },
          this.goalIndex
        );
        
        // Update current state
        this.currentState[move.robot as keyof Robots] = newPos;
        
        // Update UI
        this.updateUI();
        
        // Check if goal reached
        this.checkGoalReached();
      }
    }
    
    this.isProcessingQueue = false;
    this.updateButtonStates(); // Re-enable buttons
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
    
    // Update button states
    this.updateButtonStates();
  }

  /**
   * Update button enabled/disabled states based on game state
   */
  private updateButtonStates(): void {
    const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
    const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    
    const hasHistory = this.moveHistory.length > 0;
    const isProcessing = this.isProcessingQueue;
    
    // Disable undo/reset/submit if queue is processing or no history
    if (undoBtn) {
      undoBtn.disabled = isProcessing || !hasHistory;
    }
    if (resetBtn) {
      resetBtn.disabled = isProcessing || !hasHistory;
    }
    if (submitBtn) {
      submitBtn.disabled = isProcessing || !hasHistory;
    }
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

  /**
   * Re-render the current game state
   * Used when canvas needs to be redrawn (e.g., after resize)
   */
  rerender(): void {
    this.render();
  }
}
