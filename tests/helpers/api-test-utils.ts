/**
 * API Test Utilities
 * Helper functions for testing Azure Functions API endpoints
 */

import fetch, { Response } from 'node-fetch';

/**
 * Base URL for local Azure Functions
 */
export const API_BASE_URL = 'http://localhost:7071/api';

/**
 * Type definitions for API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface GameCreationResponse {
  gameId: string;
  hostKey: string;
  gameName: string;
  totalGoals: number;
  goalsCompleted: number;
  urls?: {
    player: string;
    host: string;
  };
  message?: string;
  nextSteps?: string[];
}

export interface RoundData {
  roundId: string;
  roundNumber: number;
  gameId: string;
  status: string;
  goal: {
    color: string;
    position: { x: number; y: number };
  };
  robotPositions: any;
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  moveCount: number;
  submittedAt: string;
  solutionData?: any;
  winningRobot?: string;
}

/**
 * Make HTTP request to API endpoint
 */
export async function makeRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { method = 'GET', body, headers = {} } = options;

  const fetchOptions: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
}

/**
 * Parse JSON response with error handling
 */
export async function parseResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
  try {
    return await response.json() as ApiResponse<T>;
  } catch (error) {
    throw new Error(`Failed to parse response: ${error}`);
  }
}

/**
 * Create a test game and return credentials
 */
export async function createTestGame(
  gameName: string = 'Test Game',
  defaultRoundDurationMs: number = 3600000
): Promise<GameCreationResponse> {
  const response = await makeRequest('/createGame', {
    method: 'POST',
    body: {
      gameName,
      defaultRoundDurationMs,
    },
  });

  const result = await parseResponse<GameCreationResponse>(response);

  if (!result.success || !result.data) {
    throw new Error(`Failed to create game: ${result.error}`);
  }

  return result.data;
}

/**
 * Start a test round
 */
export async function startTestRound(
  gameId: string,
  hostKey: string,
  durationMs?: number
): Promise<RoundData> {
  const body: any = {
    gameId,
    hostKey,
  };

  // Only include customDurationMs if provided
  if (durationMs !== undefined) {
    body.customDurationMs = durationMs;
  }

  const response = await makeRequest('/host/startRound', {
    method: 'POST',
    body,
  });

  const result = await parseResponse<any>(response);

  if (!result.success || !result.data || !result.data.round) {
    throw new Error(`Failed to start round: ${result.error}`);
  }

  return result.data.round;
}

/**
 * Submit a test solution
 */
export async function submitTestSolution(
  gameId: string,
  roundId: string,
  playerName: string,
  moves: Array<{ robot: string; direction: string }>
): Promise<{ rank: number; moveCount: number }> {
  const response = await makeRequest('/submitSolution', {
    method: 'POST',
    body: {
      gameId,
      roundId,
      playerName,
      moves,
    },
  });

  const result = await parseResponse(response);

  if (!result.success || !result.data) {
    throw new Error(`Failed to submit solution: ${result.error}`);
  }

  return result.data;
}

/**
 * End a round
 */
export async function endTestRound(
  gameId: string,
  hostKey: string,
  roundId: string,
  skipGoal: boolean = false
): Promise<any> {
  const response = await makeRequest('/host/endRound', {
    method: 'POST',
    body: {
      gameId,
      hostKey,
      roundId,
      skipGoal,
    },
  });

  const result = await parseResponse(response);

  if (!result.success) {
    throw new Error(`Failed to end round: ${result.error}`);
  }

  return result.data;
}

/**
 * Get current round
 */
export async function getCurrentRound(gameId: string): Promise<ApiResponse> {
  const response = await makeRequest(`/getCurrentRound?gameId=${gameId}`);
  return parseResponse(response);
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  gameId: string,
  roundId: string
): Promise<LeaderboardEntry[]> {
  const response = await makeRequest(`/getLeaderboard?gameId=${gameId}&roundId=${roundId}`);
  const result = await parseResponse<LeaderboardEntry[]>(response);

  if (!result.success || !result.data) {
    throw new Error(`Failed to get leaderboard: ${result.error}`);
  }

  return result.data;
}

/**
 * Craft a valid solution that reaches a goal
 * This is a simple helper - actual solutions depend on board state
 */
export function craftSimpleSolution(
  goalPosition: { x: number; y: number },
  robotStartPosition: { x: number; y: number },
  robotColor: string
): Array<{ robot: string; direction: string }> {
  const moves: Array<{ robot: string; direction: string }> = [];

  // Simple 2-move solution (horizontal then vertical)
  // This won't work for all boards, but useful for basic tests
  if (robotStartPosition.x !== goalPosition.x) {
    moves.push({
      robot: robotColor,
      direction: robotStartPosition.x < goalPosition.x ? 'right' : 'left',
    });
  }

  if (robotStartPosition.y !== goalPosition.y) {
    moves.push({
      robot: robotColor,
      direction: robotStartPosition.y < goalPosition.y ? 'down' : 'up',
    });
  }

  return moves;
}

/**
 * Wait for a specified duration (for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if Azure Functions is running
 */
export async function isAzureFunctionsRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/admin/host/status`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if Azurite is running
 * Note: This checks if createGame can connect to storage
 */
export async function isAzuriteRunning(): Promise<boolean> {
  try {
    await createTestGame('Azurite Check', 1000);
    return true;
  } catch (error) {
    return false;
  }
}
