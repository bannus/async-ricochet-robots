/**
 * Goal placement logic for Async Ricochet Robots
 * Generates valid goal positions with L-shaped walls across quadrants
 */

import type { Position, Goal, Walls, GoalColorValue } from './types.js';
import {
  canPlaceLShape,
  addLShapeWall,
  getRandomOrientation,
  isValidLShapePosition,
  type LShape,
  type LShapeOrientation
} from './l-shape-utils.js';

/**
 * Quadrant definition for goal placement
 */
export interface Quadrant {
  name: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Result of goal generation attempt
 */
export interface GoalGenerationResult {
  goals: Goal[];
  lShapes: LShape[];
  success: boolean;
  error?: string;
}

/**
 * Define the four quadrants (excluding outer boundary AND center 2×2 square)
 * Center square occupies (7,7), (7,8), (8,7), (8,8)
 * Quadrants exclude rows/cols 7-8 to avoid the center
 */
export const QUADRANTS: Quadrant[] = [
  { name: 'NW', xMin: 1, xMax: 6, yMin: 1, yMax: 6 },
  { name: 'NE', xMin: 9, xMax: 14, yMin: 1, yMax: 6 },
  { name: 'SW', xMin: 1, xMax: 6, yMin: 9, yMax: 14 },
  { name: 'SE', xMin: 9, xMax: 14, yMin: 9, yMax: 14 }
];

/**
 * Standard robot colors for single-color goals
 */
export const ROBOT_COLORS: GoalColorValue[] = ['red', 'yellow', 'green', 'blue'];

/**
 * Generates a random position within a quadrant
 */
export function randomPositionInQuadrant(quadrant: Quadrant): Position {
  const x = quadrant.xMin + Math.floor(Math.random() * (quadrant.xMax - quadrant.xMin + 1));
  const y = quadrant.yMin + Math.floor(Math.random() * (quadrant.yMax - quadrant.yMin + 1));
  return { x, y };
}

/**
 * Attempts to place a single goal with L-shaped wall in a quadrant
 */
export function placeGoalInQuadrant(
  quadrant: Quadrant,
  _color: GoalColorValue,
  existingLShapes: LShape[],
  walls: Walls,
  maxAttempts: number = 500
): { position: Position; orientation: LShapeOrientation } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const position = randomPositionInQuadrant(quadrant);
    
    // Validate position is within bounds
    if (!isValidLShapePosition(position, quadrant.xMin, quadrant.xMax, quadrant.yMin, quadrant.yMax)) {
      continue;
    }
    
    const orientation = getRandomOrientation();
    
    // Check if L-shape can be placed without overlap or touching existing walls
    if (canPlaceLShape(position, orientation, existingLShapes, walls)) {
      return { position, orientation };
    }
  }
  
  return null;
}

/**
 * Generates 16 single-color goals (4 per quadrant) with L-shaped walls
 */
export function generateSingleColorGoals(
  walls: Walls
): GoalGenerationResult {
  const goals: Goal[] = [];
  const lShapes: LShape[] = [];
  
  // Generate 4 goals per quadrant (one of each color)
  for (const quadrant of QUADRANTS) {
    for (const color of ROBOT_COLORS) {
      const placement = placeGoalInQuadrant(quadrant, color, lShapes, walls);
      
      if (!placement) {
        return {
          goals: [],
          lShapes: [],
          success: false,
          error: `Failed to place ${color} goal in ${quadrant.name} quadrant`
        };
      }
      
      // Add L-shaped wall
      addLShapeWall(walls, placement.position, placement.orientation);
      lShapes.push({ position: placement.position, orientation: placement.orientation });
      
      // Add goal
      goals.push({ position: placement.position, color });
    }
  }
  
  return { goals, lShapes, success: true };
}

/**
 * Generates 1 multi-color goal in a random quadrant
 */
export function generateMultiColorGoal(
  walls: Walls,
  existingLShapes: LShape[]
): GoalGenerationResult {
  // Randomly select a quadrant
  const quadrant = QUADRANTS[Math.floor(Math.random() * QUADRANTS.length)];
  
  const placement = placeGoalInQuadrant(quadrant, 'multi', existingLShapes, walls, 200);
  
  if (!placement) {
    return {
      goals: [],
      lShapes: [],
      success: false,
      error: `Failed to place multi-color goal in ${quadrant.name} quadrant`
    };
  }
  
  // Add L-shaped wall
  addLShapeWall(walls, placement.position, placement.orientation);
  const lShape: LShape = { position: placement.position, orientation: placement.orientation };
  
  // Create multi-color goal
  const goal: Goal = { position: placement.position, color: 'multi' };
  
  return {
    goals: [goal],
    lShapes: [lShape],
    success: true
  };
}

/**
 * Generates all 17 goals (16 single-color + 1 multi-color) for a board
 * 
 * With smaller quadrants (6×6 instead of 7×7 to avoid center), we retry
 * the entire generation if it fails due to space constraints.
 * 
 * Note: This function assumes walls already contains center square and outer edge walls.
 * On retry, it clears only the L-shape walls (not center/edge walls).
 */
export function generateAllGoals(walls: Walls, maxRetries: number = 10): GoalGenerationResult {
  // Store initial wall state (center square + outer edges) before adding L-shapes
  const initialHorizontal = walls.horizontal.map(row => [...row]);
  const initialVertical = walls.vertical.map(col => [...col]);
  
  for (let retry = 0; retry < maxRetries; retry++) {
    // Reset to initial state (clear L-shape walls but keep center/edges)
    if (retry > 0) {
      for (let i = 0; i < 16; i++) {
        walls.horizontal[i] = [...initialHorizontal[i]];
        walls.vertical[i] = [...initialVertical[i]];
      }
    }
    
    // Generate 16 single-color goals
    const singleColorResult = generateSingleColorGoals(walls);
    
    if (!singleColorResult.success) {
      continue; // Retry
    }
    
    // Generate 1 multi-color goal
    const multiColorResult = generateMultiColorGoal(walls, singleColorResult.lShapes);
    
    if (!multiColorResult.success) {
      continue; // Retry
    }
    
    // Success! Combine results
    return {
      goals: [...singleColorResult.goals, ...multiColorResult.goals],
      lShapes: [...singleColorResult.lShapes, ...multiColorResult.lShapes],
      success: true
    };
  }
  
  // Failed after all retries
  return {
    goals: [],
    lShapes: [],
    success: false,
    error: `Failed to generate all 17 goals after ${maxRetries} retries`
  };
}

/**
 * Validates that all goals have been generated correctly
 */
export function validateGoals(goals: Goal[]): { valid: boolean; error?: string } {
  // Should have exactly 17 goals
  if (goals.length !== 17) {
    return { valid: false, error: `Expected 17 goals, got ${goals.length}` };
  }
  
  // Should have exactly 1 multi-color goal
  const multiColorGoals = goals.filter(g => g.color === 'multi');
  if (multiColorGoals.length !== 1) {
    return { valid: false, error: `Expected 1 multi-color goal, got ${multiColorGoals.length}` };
  }
  
  // Should have 4 goals of each robot color
  for (const color of ROBOT_COLORS) {
    const colorGoals = goals.filter(g => g.color === color);
    if (colorGoals.length !== 4) {
      return { valid: false, error: `Expected 4 ${color} goals, got ${colorGoals.length}` };
    }
  }
  
  // Check for duplicate positions
  const positions = new Set<string>();
  for (const goal of goals) {
    const key = `${goal.position.x},${goal.position.y}`;
    if (positions.has(key)) {
      return { valid: false, error: `Duplicate goal position at (${goal.position.x}, ${goal.position.y})` };
    }
    positions.add(key);
  }
  
  return { valid: true };
}
