/**
 * Goal placement logic for Async Ricochet Robots
 * Generates valid goal positions with L-shaped walls across quadrants
 */

import type { Position, Goal, Walls, GoalColorValue } from './types';
import {
  canPlaceLShape,
  addLShapeWall,
  getRandomOrientation,
  isValidLShapePosition,
  type LShape,
  type LShapeOrientation
} from './l-shape-utils';

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
 * Define the four quadrants (excluding outer boundary)
 */
export const QUADRANTS: Quadrant[] = [
  { name: 'NW', xMin: 1, xMax: 7, yMin: 1, yMax: 7 },
  { name: 'NE', xMin: 8, xMax: 14, yMin: 1, yMax: 7 },
  { name: 'SW', xMin: 1, xMax: 7, yMin: 8, yMax: 14 },
  { name: 'SE', xMin: 8, xMax: 14, yMin: 8, yMax: 14 }
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
  color: GoalColorValue,
  existingLShapes: LShape[],
  maxAttempts: number = 100
): { position: Position; orientation: LShapeOrientation } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const position = randomPositionInQuadrant(quadrant);
    
    // Validate position is within bounds
    if (!isValidLShapePosition(position, quadrant.xMin, quadrant.xMax, quadrant.yMin, quadrant.yMax)) {
      continue;
    }
    
    const orientation = getRandomOrientation();
    
    // Check if L-shape can be placed without overlap
    if (canPlaceLShape(position, orientation, existingLShapes)) {
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
      const placement = placeGoalInQuadrant(quadrant, color, lShapes);
      
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
  
  const placement = placeGoalInQuadrant(quadrant, 'multi', existingLShapes, 200);
  
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
 */
export function generateAllGoals(walls: Walls): GoalGenerationResult {
  // Generate 16 single-color goals
  const singleColorResult = generateSingleColorGoals(walls);
  
  if (!singleColorResult.success) {
    return singleColorResult;
  }
  
  // Generate 1 multi-color goal
  const multiColorResult = generateMultiColorGoal(walls, singleColorResult.lShapes);
  
  if (!multiColorResult.success) {
    return multiColorResult;
  }
  
  // Combine results
  return {
    goals: [...singleColorResult.goals, ...multiColorResult.goals],
    lShapes: [...singleColorResult.lShapes, ...multiColorResult.lShapes],
    success: true
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
