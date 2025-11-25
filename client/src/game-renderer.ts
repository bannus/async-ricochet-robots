/**
 * Game Renderer Module
 * Handles HTML5 Canvas rendering of the 16×16 game board
 * Renders robots, walls, goals, and animations
 */

import type { Position, Robots, Walls, Goal, Move } from '../../shared/types.js';

interface Puzzle {
  walls: Walls;
  robots: Robots;
  allGoals: Goal[];
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  
  // Path preview configuration constants
  private static readonly PATH_PREVIEW_ALPHA = 0.3;
  private static readonly PATH_PREVIEW_LINE_WIDTH_RATIO = 0.65; // ratio of cellSize
  
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
    this.setupCanvas();
  }

  /**
   * Get CSS variable value from the document root
   */
  private getCSSVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
   * Resets transform to ensure clearRect works in raw pixel coordinates
   * This prevents zoom-level bugs where only part of canvas gets cleared
   */
  clear(): void {
    // Save current transform state
    this.ctx.save();
    
    // Reset to identity transform (no scaling/rotation/translation)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear entire canvas buffer in raw pixel coordinates
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Restore previous transform for subsequent drawing operations
    this.ctx.restore();
  }

  /**
   * Draw the 16×16 grid lines
   */
  private drawGrid(): void {
    const gridColor = this.getCSSVariable('--color-grid-line') || '#ECF0F1';
    this.ctx.strokeStyle = gridColor;
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
    const wallColor = this.getCSSVariable('--color-wall') || '#2C3E50';
    this.ctx.strokeStyle = wallColor;
    this.ctx.lineWidth = this.cellSize * 0.1;
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
    const radius = isActive ? this.cellSize * 0.35 : this.cellSize * 0.15;
    
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
      const wallColor = this.getCSSVariable('--color-wall') || '#2C3E50';
      this.ctx.strokeStyle = wallColor;
      this.ctx.lineWidth = this.cellSize * 0.05;
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
    const wallColor = this.getCSSVariable('--color-wall') || '#2C3E50';
    this.ctx.strokeStyle = wallColor;
    this.ctx.lineWidth = this.cellSize * 0.05;
    this.ctx.stroke();
    
    // Draw label (first letter of color)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `bold ${this.cellSize * 0.4}px Arial`;
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
    activeGoalIndex: number
  ): Promise<void> {
    return new Promise((resolve) => {
      // Calculate Manhattan distance
      const distance = Math.abs(toPos.x - fromPos.x) + Math.abs(toPos.y - fromPos.y);
      
      // Duration proportional to distance (30ms per tile)
      const msPerTile = 30;
      const duration = distance * msPerTile;
      
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
    const wallColor = this.getCSSVariable('--color-wall') || '#2C3E50';
    this.ctx.strokeStyle = wallColor;
    this.ctx.lineWidth = this.cellSize * 0.075;
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
   * Setup canvas with proper high-DPI support
   */
  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 16 * this.cellSize;
    const cssHeight = 16 * this.cellSize;
    
    // Set buffer size (actual pixels) for high-DPI displays
    this.canvas.width = cssWidth * dpr;
    this.canvas.height = cssHeight * dpr;
    
    // Set CSS size (display size)
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    
    // Scale context to match device pixel ratio
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Resize canvas (for responsive design)
   */
  resize(newCellSize: number): void {
    this.cellSize = newCellSize;
    this.setupCanvas();
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

  /**
   * Draw a faint preview of a solution's path on hover
   * Shows the path taken by each robot with semi-transparent lines
   * Each robot gets its own colored path
   * Overlapping segments naturally darken due to alpha blending
   */
  drawSolutionPathPreview(
    moves: Move[],
    startingRobots: Robots,
    robotColor: string,
    puzzle: Puzzle,
    activeGoalIndex: number
  ): void {
    if (!moves || moves.length === 0) return;

    // Import game engine functions to simulate moves
    import('../../shared/game-engine.js').then(({ applyMove }) => {
      // Start with the initial positions
      let currentRobots = { ...startingRobots };
      
      // Group consecutive moves by robot to draw separate path segments
      interface PathSegment {
        robot: string;
        positions: Position[];
      }
      
      const pathSegments: PathSegment[] = [];
      let currentSegment: PathSegment | null = null;
      
      // Simulate each move and group by robot
      for (const move of moves) {
        const movingRobot = move.robot;
        
        // If starting a new segment or robot changed
        if (!currentSegment || currentSegment.robot !== movingRobot) {
          // Save previous segment if it exists
          if (currentSegment) {
            pathSegments.push(currentSegment);
          }
          
          // Start new segment with this robot's current position
          currentSegment = {
            robot: movingRobot,
            positions: [{ ...currentRobots[movingRobot as keyof Robots] }]
          };
        }
        
        // Apply the move
        currentRobots = applyMove(currentRobots, puzzle.walls, move);
        
        // Add new position to current segment
        currentSegment.positions.push({ ...currentRobots[movingRobot as keyof Robots] });
      }
      
      // Don't forget the last segment
      if (currentSegment) {
        pathSegments.push(currentSegment);
      }
      
      // Now draw each path segment in its robot's color
      this.ctx.save();
      this.ctx.globalAlpha = GameRenderer.PATH_PREVIEW_ALPHA;
      this.ctx.lineWidth = this.cellSize * GameRenderer.PATH_PREVIEW_LINE_WIDTH_RATIO;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      for (const segment of pathSegments) {
        // Set color for this robot
        this.ctx.strokeStyle = this.colors[segment.robot as keyof typeof this.colors];
        
        // Draw lines connecting consecutive positions in this segment
        this.ctx.beginPath();
        for (let i = 0; i < segment.positions.length; i++) {
          const pos = segment.positions[i];
          const x = pos.x * this.cellSize + this.cellSize / 2;
          const y = pos.y * this.cellSize + this.cellSize / 2;
          
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    });
  }
}
