/**
 * Input Validation Utilities for Async Ricochet Robots API
 * Provides reusable validation functions for all endpoints
 */

import type { Move } from '../lib-shared/types';
import { isValidMove, isValidRobotColor, isValidDirection } from '../lib-shared/types';

// ============================================================================
// Validation Error Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationException extends Error {
  constructor(
    public errors: ValidationError[],
    public statusCode: number = 400
  ) {
    super(errors.map(e => e.message).join('; '));
    this.name = 'ValidationException';
  }

  toResponse() {
    return {
      success: false,
      error: this.errors.length === 1 
        ? this.errors[0].message 
        : `Validation failed: ${this.errors.map(e => e.field).join(', ')}`,
      code: 'VALIDATION_ERROR',
      details: this.errors
    };
  }
}

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Validation rules for various inputs
 */
export const ValidationRules = {
  GAME_ID: {
    minLength: 5,
    maxLength: 100,
    pattern: /^game_[a-zA-Z0-9_-]+$/,
    message: 'Game ID must start with "game_" and contain only alphanumeric characters, hyphens, and underscores'
  },
  ROUND_ID: {
    minLength: 5,
    maxLength: 100,
    pattern: /^round_[a-zA-Z0-9_-]+$/,
    message: 'Round ID must start with "round_" and contain only alphanumeric characters, hyphens, and underscores'
  },
  HOST_KEY: {
    minLength: 5,
    maxLength: 100,
    pattern: /^host_[a-zA-Z0-9_-]+$/,
    message: 'Host key must start with "host_" and contain only alphanumeric characters, hyphens, and underscores'
  },
  PLAYER_NAME: {
    minLength: 1,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9 _-]+$/,
    message: 'Player name must be 1-20 characters, alphanumeric plus spaces, hyphens, and underscores'
  },
  GAME_NAME: {
    minLength: 1,
    maxLength: 100,
    message: 'Game name must be 1-100 characters'
  },
  DURATION_MS: {
    min: 60000, // 1 minute
    max: 7 * 24 * 60 * 60 * 1000, // 1 week
    message: 'Duration must be between 1 minute and 1 week'
  }
};

// ============================================================================
// Basic Validators
// ============================================================================

/**
 * Validate that a value is a non-empty string
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null) {
    throw new ValidationException([{
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD'
    }]);
  }

  if (typeof value === 'string' && value.trim() === '') {
    throw new ValidationException([{
      field: fieldName,
      message: `${fieldName} cannot be empty`,
      code: 'EMPTY_FIELD'
    }]);
  }
}

/**
 * Validate string length and pattern
 */
export function validateString(
  value: string | undefined,
  fieldName: string,
  rules: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
    required?: boolean;
  }
): void {
  // Check if required
  if (rules.required && (value === undefined || value === null || value.trim() === '')) {
    throw new ValidationException([{
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD'
    }]);
  }

  // Allow optional fields
  if (!value && !rules.required) {
    return;
  }

  const trimmed = value!.trim();

  // Check length
  if (rules.minLength !== undefined && trimmed.length < rules.minLength) {
    throw new ValidationException([{
      field: fieldName,
      message: rules.message || `${fieldName} must be at least ${rules.minLength} characters`,
      code: 'STRING_TOO_SHORT'
    }]);
  }

  if (rules.maxLength !== undefined && trimmed.length > rules.maxLength) {
    throw new ValidationException([{
      field: fieldName,
      message: rules.message || `${fieldName} must be at most ${rules.maxLength} characters`,
      code: 'STRING_TOO_LONG'
    }]);
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(trimmed)) {
    throw new ValidationException([{
      field: fieldName,
      message: rules.message || `${fieldName} format is invalid`,
      code: 'INVALID_FORMAT'
    }]);
  }
}

/**
 * Validate number range
 */
export function validateNumber(
  value: any,
  fieldName: string,
  rules: {
    min?: number;
    max?: number;
    integer?: boolean;
    message?: string;
    required?: boolean;
  }
): void {
  // Check if required
  if (rules.required && (value === undefined || value === null)) {
    throw new ValidationException([{
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD'
    }]);
  }

  // Allow optional fields
  if (value === undefined || value === null) {
    if (!rules.required) return;
  }

  // Check if number
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationException([{
      field: fieldName,
      message: `${fieldName} must be a number`,
      code: 'INVALID_TYPE'
    }]);
  }

  // Check integer
  if (rules.integer && !Number.isInteger(value)) {
    throw new ValidationException([{
      field: fieldName,
      message: `${fieldName} must be an integer`,
      code: 'MUST_BE_INTEGER'
    }]);
  }

  // Check range
  if (rules.min !== undefined && value < rules.min) {
    throw new ValidationException([{
      field: fieldName,
      message: rules.message || `${fieldName} must be at least ${rules.min}`,
      code: 'NUMBER_TOO_SMALL'
    }]);
  }

  if (rules.max !== undefined && value > rules.max) {
    throw new ValidationException([{
      field: fieldName,
      message: rules.message || `${fieldName} must be at most ${rules.max}`,
      code: 'NUMBER_TOO_LARGE'
    }]);
  }
}

/**
 * Validate boolean
 */
export function validateBoolean(
  value: any,
  fieldName: string,
  required: boolean = false
): void {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      }]);
    }
    return;
  }

  if (typeof value !== 'boolean') {
    throw new ValidationException([{
      field: fieldName,
      message: `${fieldName} must be a boolean`,
      code: 'INVALID_TYPE'
    }]);
  }
}

// ============================================================================
// Domain-Specific Validators
// ============================================================================

/**
 * Validate game ID format
 */
export function validateGameId(gameId: any): void {
  validateString(gameId, 'gameId', {
    ...ValidationRules.GAME_ID,
    required: true
  });
}

/**
 * Validate round ID format
 */
export function validateRoundId(roundId: any): void {
  validateString(roundId, 'roundId', {
    ...ValidationRules.ROUND_ID,
    required: true
  });
}

/**
 * Validate host key format
 */
export function validateHostKey(hostKey: any): void {
  validateString(hostKey, 'hostKey', {
    ...ValidationRules.HOST_KEY,
    required: true
  });
}

/**
 * Validate player name
 */
export function validatePlayerName(playerName: any): void {
  validateString(playerName, 'playerName', {
    ...ValidationRules.PLAYER_NAME,
    required: true
  });
}

/**
 * Validate game name
 */
export function validateGameName(gameName: any): void {
  if (gameName === undefined || gameName === null) {
    return; // Optional field
  }

  validateString(gameName, 'gameName', {
    ...ValidationRules.GAME_NAME,
    required: false
  });
}

/**
 * Validate duration in milliseconds
 */
export function validateDuration(durationMs: any): void {
  if (durationMs === undefined || durationMs === null) {
    return; // Optional field
  }

  validateNumber(durationMs, 'durationMs', {
    ...ValidationRules.DURATION_MS,
    integer: true,
    required: false
  });
}

/**
 * Validate solution data array
 */
export function validateSolutionData(solutionData: any): void {
  // Check if array
  if (!Array.isArray(solutionData)) {
    throw new ValidationException([{
      field: 'solutionData',
      message: 'Solution data must be an array of moves',
      code: 'INVALID_TYPE'
    }]);
  }

  // Check not empty
  if (solutionData.length === 0) {
    throw new ValidationException([{
      field: 'solutionData',
      message: 'Solution must contain at least one move',
      code: 'EMPTY_SOLUTION'
    }]);
  }

  // Check max length (reasonable limit)
  if (solutionData.length > 1000) {
    throw new ValidationException([{
      field: 'solutionData',
      message: 'Solution cannot exceed 1000 moves',
      code: 'SOLUTION_TOO_LONG'
    }]);
  }

  // Validate each move
  const errors: ValidationError[] = [];
  
  for (let i = 0; i < solutionData.length; i++) {
    const move = solutionData[i];

    // Check if object
    if (typeof move !== 'object' || move === null) {
      errors.push({
        field: `solutionData[${i}]`,
        message: `Move at index ${i} must be an object`,
        code: 'INVALID_MOVE'
      });
      continue;
    }

    // Check robot field
    if (!move.robot || typeof move.robot !== 'string') {
      errors.push({
        field: `solutionData[${i}].robot`,
        message: `Move at index ${i} missing valid robot`,
        code: 'INVALID_MOVE'
      });
    } else if (!isValidRobotColor(move.robot)) {
      errors.push({
        field: `solutionData[${i}].robot`,
        message: `Move at index ${i} has invalid robot: ${move.robot}. Must be 'red', 'yellow', 'green', or 'blue'`,
        code: 'INVALID_ROBOT'
      });
    }

    // Check direction field
    if (!move.direction || typeof move.direction !== 'string') {
      errors.push({
        field: `solutionData[${i}].direction`,
        message: `Move at index ${i} missing valid direction`,
        code: 'INVALID_MOVE'
      });
    } else if (!isValidDirection(move.direction)) {
      errors.push({
        field: `solutionData[${i}].direction`,
        message: `Move at index ${i} has invalid direction: ${move.direction}. Must be 'up', 'down', 'left', or 'right'`,
        code: 'INVALID_DIRECTION'
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
}

/**
 * Validate timestamp
 */
export function validateTimestamp(timestamp: any, fieldName: string, required: boolean = false): void {
  if (timestamp === undefined || timestamp === null) {
    if (required) {
      throw new ValidationException([{
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      }]);
    }
    return;
  }

  validateNumber(timestamp, fieldName, {
    min: 0,
    integer: true,
    message: `${fieldName} must be a valid Unix timestamp`,
    required: false
  });
}

// ============================================================================
// Request Body Validators
// ============================================================================

/**
 * Validate createGame request body
 */
export function validateCreateGameRequest(body: any): void {
  if (!body || typeof body !== 'object') {
    throw new ValidationException([{
      field: 'body',
      message: 'Request body must be a JSON object',
      code: 'INVALID_BODY'
    }]);
  }

  validateGameName(body.gameName);
  validateDuration(body.defaultRoundDurationMs);
}

/**
 * Validate submitSolution request body
 */
export function validateSubmitSolutionRequest(body: any): void {
  if (!body || typeof body !== 'object') {
    throw new ValidationException([{
      field: 'body',
      message: 'Request body must be a JSON object',
      code: 'INVALID_BODY'
    }]);
  }

  validateGameId(body.gameId);
  validateRoundId(body.roundId);
  validatePlayerName(body.playerName);
  validateSolutionData(body.solutionData);
}

/**
 * Validate startRound request body
 */
export function validateStartRoundRequest(body: any): void {
  if (!body || typeof body !== 'object') {
    throw new ValidationException([{
      field: 'body',
      message: 'Request body must be a JSON object',
      code: 'INVALID_BODY'
    }]);
  }

  // durationMs is optional - uses game default if not provided
  validateDuration(body.durationMs);
}

/**
 * Validate extendRound request body
 */
export function validateExtendRoundRequest(body: any): void {
  if (!body || typeof body !== 'object') {
    throw new ValidationException([{
      field: 'body',
      message: 'Request body must be a JSON object',
      code: 'INVALID_BODY'
    }]);
  }

  validateRoundId(body.roundId);
  
  // extendByMs is required
  validateNumber(body.extendByMs, 'extendByMs', {
    min: 1000, // At least 1 second
    max: 7 * 24 * 60 * 60 * 1000, // At most 1 week
    integer: true,
    message: 'Extension must be between 1 second and 1 week',
    required: true
  });
}

/**
 * Validate endRound request body
 */
export function validateEndRoundRequest(body: any): void {
  if (!body || typeof body !== 'object') {
    throw new ValidationException([{
      field: 'body',
      message: 'Request body must be a JSON object',
      code: 'INVALID_BODY'
    }]);
  }

  validateRoundId(body.roundId);
  validateBoolean(body.skipGoal, 'skipGoal', false);
}

// ============================================================================
// Query Parameter Validators
// ============================================================================

/**
 * Validate getCurrentRound query parameters
 */
export function validateGetCurrentRoundQuery(query: any): void {
  if (!query || typeof query !== 'object') {
    throw new ValidationException([{
      field: 'query',
      message: 'Query parameters required',
      code: 'MISSING_QUERY'
    }]);
  }

  validateGameId(query.gameId);
}

/**
 * Validate getLeaderboard query parameters
 */
export function validateGetLeaderboardQuery(query: any): void {
  if (!query || typeof query !== 'object') {
    throw new ValidationException([{
      field: 'query',
      message: 'Query parameters required',
      code: 'MISSING_QUERY'
    }]);
  }

  validateGameId(query.gameId);
  validateRoundId(query.roundId);
}

// ============================================================================
// Header Validators
// ============================================================================

/**
 * Validate host authentication headers
 */
export function validateHostHeaders(headers: any): { gameId: string; hostKey: string } {
  if (!headers || typeof headers !== 'object') {
    throw new ValidationException([{
      field: 'headers',
      message: 'Missing authentication headers',
      code: 'MISSING_HEADERS'
    }], 401);
  }

  const gameId = headers['x-game-id'] || headers['X-Game-Id'];
  const hostKey = headers['x-host-key'] || headers['X-Host-Key'];

  if (!gameId) {
    throw new ValidationException([{
      field: 'X-Game-Id',
      message: 'X-Game-Id header is required',
      code: 'MISSING_GAME_ID'
    }], 401);
  }

  if (!hostKey) {
    throw new ValidationException([{
      field: 'X-Host-Key',
      message: 'X-Host-Key header is required',
      code: 'MISSING_HOST_KEY'
    }], 401);
  }

  validateGameId(gameId);
  validateHostKey(hostKey);

  return { gameId, hostKey };
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create success response
 */
export function successResponse(data: any, statusCode: number = 200) {
  return {
    status: statusCode,
    jsonBody: {
      success: true,
      data
    },
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  code: string,
  statusCode: number = 400,
  additionalData?: any
) {
  return {
    status: statusCode,
    jsonBody: {
      success: false,
      error,
      code,
      ...additionalData
    },
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Handle validation exception
 */
export function handleValidationError(error: ValidationException) {
  return {
    status: error.statusCode,
    jsonBody: error.toResponse(),
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Handle storage error
 */
export function handleStorageError(error: any) {
  // Map storage error codes to appropriate HTTP status codes
  let statusCode = error.statusCode || 500;
  let code = error.code || 'STORAGE_ERROR';
  
  // Map common error codes
  if (code === 'NOT_FOUND') {
    if (error.message.includes('Game')) {
      code = 'GAME_NOT_FOUND';
      statusCode = 404;
    } else if (error.message.includes('Round')) {
      code = 'ROUND_NOT_FOUND';
      statusCode = 404;
    }
  }

  return errorResponse(
    error.message || 'An internal error occurred',
    code,
    statusCode
  );
}

/**
 * Catch-all error handler
 */
export function handleError(error: any) {
  // Handle validation exceptions
  if (error instanceof ValidationException) {
    return handleValidationError(error);
  }

  // Handle storage errors
  if (error.code && error.statusCode) {
    return handleStorageError(error);
  }

  // Generic error
  console.error('Unhandled error:', error);
  return errorResponse(
    'An unexpected error occurred',
    'INTERNAL_ERROR',
    500
  );
}
