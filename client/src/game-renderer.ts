/**
 * Game Renderer Module
 * Handles HTML5 Canvas rendering of the 16×16 game board
 * Renders robots, walls, goals, and animations
 */

import type { Position, Robots, Walls, Goal } from '../../shared/types.js';

interface Puzzle {
  walls: Walls;
  robots: Robots;
  allGoals: Goal[];
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  
  private colors = {
    red: '#E74C3C',
    yellow: '#F39C12',
    green: '#27AE60',
    blue: '#3498DB',
    multi: '#9B59B6'
  };

  constructor(canvasId: string, cellSize: number = 40) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }
    
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
    
    this.cellSize = cellSize;
    this.canvas.width = 16 * this.cellSize;
    this.canvas.height = 16 * this.cellSize;
  }

  /**
   * Main render method - draws complete game state
   */
  render(puzzle: Puzzle, activeGoalIndex: number): void {
    this.clear();
    this.drawGrid();
    this.drawWalls(puzzle.walls);
    this.drawAllGoals(puzzle.allGoals, activeGoalIndex);
    this.drawRobots(puzzle.robots);
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw the 16×16 grid lines
   */
  private drawGrid(): void {
    this.ctx.strokeStyle = '#ECF0F1';
    this.ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let i = 0; i <= 16; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 0; i <= 16; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(this.canvas.width, i * this.cellSize);
      this.ctx.stroke();
    }
  }

  /**
   * Draw all walls on the board
   */
  private drawWalls(walls: Walls): void {
    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'square';
    
    // Draw horizontal walls (below each row)
    for (let row = 0; row < 16; row++) {
      if (walls.horizontal[row]) {
        for (const col of walls.horizontal[row]) {
          const x = col * this.cellSize;
          const y = (row + 1) * this.cellSize;
          
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x + this.cellSize, y);
          this.ctx.stroke();
        }
      }
    }
    
    // Draw vertical walls (right of each column)
    for (let col = 0; col < 16; col++) {
      if (walls.vertical[col]) {
        for (const row of walls.vertical[col]) {
          const x = (col + 1) * this.cellSize;
          const y = row * this.cellSize;
          
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x, y + this.cellSize);
          this.ctx.stroke();
        }
      }
    }
  }

  /**
   * Draw all 17 goals (active one highlighted)
   */
  private drawAllGoals(allGoals: Goal[], activeGoalIndex: number): void {
    allGoals.forEach((goal, index) => {
      const isActive = index === activeGoalIndex;
      this.drawGoal(goal.position, goal.color, isActive);
    });
  }

  /**
   * Draw a single goal marker
   */
  private drawGoal(position: Position, color: string, isActive: boolean): void {
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const radius = isActive ? 14 : 6;
    
    // Set color and opacity
    this.ctx.fillStyle = this.colors[color as keyof typeof this.colors];
    this.ctx.globalAlpha = isActive ? 1.0 : 0.3;
    
    if (isActive) {
      // Draw star shape for active goal
      this.drawStar(x, y, 5, radius, radius * 0.5);
    } else {
      // Draw small circle for inactive goals
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw outline for active goal
    if (isActive) {
      this.ctx.strokeStyle = '#2C3E50';
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 1.0;
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw a star shape (for active goal)
   */
  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draw all four robots
   */
  private drawRobots(robots: Robots): void {
    const robotSize = this.cellSize * 0.6;
    
    Object.entries(robots).forEach(([color, position]) => {
      this.drawRobot(color as keyof Robots, position, robotSize);
    });
  }

  /**
   * Draw a single robot
   */
  private drawRobot(color: string, position: Position, size: number): void {
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    
    // Draw robot circle
    this.ctx.fillStyle = this.colors[color as keyof typeof this.colors];
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw outline
    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Draw label (first letter of color)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(color[0].toUpperCase(), x, y);
  }

  /**
   * Animate a robot moving from one position to another
   */
  async animateMove(
    robotColor: string,
    fromPos: Position,
    toPos: Position,
    puzzle: Puzzle,
    activeGoalIndex: number,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const tempRobots = { ...puzzle.robots };
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Calculate current position
        const currentX = fromPos.x + (toPos.x - fromPos.x) * eased;
        const currentY = fromPos.y + (toPos.y - fromPos.y) * eased;
        
        // Update temporary robot position
        tempRobots[robotColor as keyof Robots] = { 
          x: currentX, 
          y: currentY 
        };
        
        // Re-render entire board with animated position
        this.clear();
        this.drawGrid();
        this.drawWalls(puzzle.walls);
        this.drawAllGoals(puzzle.allGoals, activeGoalIndex);
        this.drawRobots(tempRobots);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Highlight a specific robot (for selection)
   */
  highlightRobot(robotColor: string | null, robots: Robots): void {
    if (!robotColor) return;
    
    const position = robots[robotColor as keyof Robots];
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize * 0.4;
    
    // Draw pulsing highlight ring
    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Get cell coordinates from mouse/touch position
   */
  getCellFromPoint(clientX: number, clientY: number): Position {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / this.cellSize);
    const y = Math.floor((clientY - rect.top) / this.cellSize);
    
    return {
      x: Math.max(0, Math.min(15, x)),
      y: Math.max(0, Math.min(15, y))
    };
  }

  /**
   * Resize canvas (for responsive design)
   */
  resize(newCellSize: number): void {
    this.cellSize = newCellSize;
    this.canvas.width = 16 * this.cellSize;
    this.canvas.height = 16 * this.cellSize;
  }

  /**
   * Get canvas dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }
}
