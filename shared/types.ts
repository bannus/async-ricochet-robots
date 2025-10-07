/**
 * Core type definitions, constants, and validation helpers for Async Ricochet Robots
 * This module provides the foundational data structures used throughout the game engine.
 */

// Enums
export enum RobotColor {
  Red = 'red',
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue'
}

export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right'
}

export enum GoalColor {
  Red = 'red',
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue',
  Multi = 'multi'
}

// Constants
export const BOARD_SIZE = 16;

// Type Aliases
export type RobotColorValue = `${RobotColor}`;
export type DirectionValue = `${Direction}`;
export type GoalColorValue = `${GoalColor}`;

// Interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Move {
  robot: RobotColorValue;
  direction: DirectionValue;
}

export interface Robots {
  red: Position;
  yellow: Position;
  green: Position;
  blue: Position;
}

export interface Walls {
  horizontal: number[][];
  vertical: number[][];
}

export interface Goal {
  position: Position;
  color: GoalColorValue;
}

// Validation Functions

/**
 * Validates a position object
 * @param pos - Position to validate
 * @returns True if valid position
 */
export function isValidPosition(pos: any): pos is Position {
  if (!pos || typeof pos !== 'object') {
    return false;
  }
  
  const { x, y } = pos;
  
  if (typeof x !== 'number' || typeof y !== 'number') {
    return false;
  }
  
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }
  
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return false;
  }
  
  return true;
}

/**
 * Validates robot color
 * @param color - Robot color to validate
 * @returns True if valid robot color
 */
export function isValidRobotColor(color: any): color is RobotColorValue {
  return Object.values(RobotColor).includes(color as RobotColor);
}

/**
 * Validates goal color (includes 'multi')
 * @param color - Goal color to validate
 * @returns True if valid goal color
 */
export function isValidGoalColor(color: any): color is GoalColorValue {
  return Object.values(GoalColor).includes(color as GoalColor);
}

/**
 * Validates direction
 * @param direction - Movement direction to validate
 * @returns True if valid direction
 */
export function isValidDirection(direction: any): direction is DirectionValue {
  return Object.values(Direction).includes(direction as Direction);
}

/**
 * Validates move object
 * @param move - Move to validate
 * @returns True if valid move
 */
export function isValidMove(move: any): move is Move {
  if (!move || typeof move !== 'object') {
    return false;
  }
  
  const { robot, direction } = move;
  
  if (!isValidRobotColor(robot)) {
    return false;
  }
  
  if (!isValidDirection(direction)) {
    return false;
  }
  
  return true;
}

// Utility Functions

/**
 * Creates a deep copy of robot positions
 * @param robots - Robot positions
 * @returns Deep copy of robots
 */
export function cloneRobots(robots: Robots): Robots {
  return {
    red: { ...robots.red },
    yellow: { ...robots.yellow },
    green: { ...robots.green },
    blue: { ...robots.blue }
  };
}

/**
 * Creates a deep copy of walls structure
 * @param walls - Walls structure
 * @returns Deep copy of walls
 */
export function cloneWalls(walls: Walls): Walls {
  return {
    horizontal: walls.horizontal.map(arr => arr ? [...arr] : []),
    vertical: walls.vertical.map(arr => arr ? [...arr] : [])
  };
}

// Helper to get all robot color values as array (for iteration)
export const ROBOT_COLORS = Object.values(RobotColor) as RobotColorValue[];
export const DIRECTIONS = Object.values(Direction) as DirectionValue[];
export const GOAL_COLORS = Object.values(GoalColor) as GoalColorValue[];
