/**
 * Storage Layer Abstraction for Async Ricochet Robots
 * Provides typed interfaces for Azure Table Storage operations
 */

import { TableClient, TableEntity, odata } from '@azure/data-tables';
import type { 
  Robots, 
  Walls, 
  Goal, 
  Move, 
  RobotColorValue 
} from '../lib-shared/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Board data stored in Games table
 */
export interface BoardData {
  walls: Walls;
  robots: Robots;
  allGoals: Goal[];
  completedGoalIndices: number[];
}

/**
 * Game entity structure
 */
export interface GameEntity {
  partitionKey: string;  // Always "GAME"
  rowKey: string;        // gameId
  hostKey: string;
  gameName?: string;
  createdAt: number;
  defaultRoundDurationMs: number;
  currentRoundId?: string;
  totalRounds: number;
  boardData: string;     // JSON stringified BoardData
}

/**
 * Round entity structure
 */
export interface RoundEntity {
  partitionKey: string;  // gameId
  rowKey: string;        // roundId
  roundNumber: number;
  goalIndex: number;
  goalColor: string;
  goalPosition: string;  // JSON stringified Position
  robotPositions: string; // JSON stringified Robots
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'active' | 'completed' | 'skipped';
  createdBy: 'host' | 'timer';
}

/**
 * Solution entity structure
 */
export interface SolutionEntity {
  partitionKey: string;  // gameId_roundId
  rowKey: string;        // playerName_timestamp (allows multiple submissions)
  displayName: string;
  moveCount: number;
  winningRobot: RobotColorValue;
  solutionData: string;  // JSON stringified Move[]
  submittedAt: number;
}

/**
 * Parsed game data for application use
 */
export interface Game {
  gameId: string;
  hostKey: string;
  gameName?: string;
  createdAt: number;
  defaultRoundDurationMs: number;
  currentRoundId?: string;
  totalRounds: number;
  board: BoardData;
}

/**
 * Parsed round data for application use
 */
export interface Round {
  gameId: string;
  roundId: string;
  roundNumber: number;
  goalIndex: number;
  goal: Goal;
  robotPositions: Robots;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'active' | 'completed' | 'skipped';
  createdBy: 'host' | 'timer';
}

/**
 * Parsed solution data for application use
 */
export interface Solution {
  gameId: string;
  roundId: string;
  playerName: string;
  displayName: string;
  moveCount: number;
  winningRobot: RobotColorValue;
  moves: Move[];
  submittedAt: number;
}

/**
 * Error types for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// ============================================================================
// Base Storage Client
// ============================================================================

/**
 * Base class for storage operations with common functionality
 */
class BaseStorageClient {
  protected tableClient: TableClient;

  constructor(tableName: string) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new StorageError(
        'AZURE_STORAGE_CONNECTION_STRING environment variable is not set',
        'MISSING_CONNECTION_STRING',
        500
      );
    }

    this.tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );
  }

  /**
   * Ensure table exists (create if needed)
   */
  async ensureTable(): Promise<void> {
    try {
      await this.tableClient.createTable();
    } catch (error: any) {
      // Ignore error if table already exists
      if (error.statusCode !== 409) {
        throw new StorageError(
          `Failed to create table: ${error.message}`,
          'TABLE_CREATION_ERROR',
          error.statusCode || 500
        );
      }
    }
  }

  /**
   * Handle common storage errors
   */
  protected handleError(error: any, context: string): never {
    if (error instanceof StorageError) {
      throw error;
    }

    const statusCode = error.statusCode || 500;
    let code = 'STORAGE_ERROR';
    let message = `${context}: ${error.message}`;

    switch (statusCode) {
      case 404:
        code = 'NOT_FOUND';
        message = `Entity not found: ${context}`;
        break;
      case 409:
        code = 'CONFLICT';
        message = `Entity already exists: ${context}`;
        break;
      case 412:
        code = 'PRECONDITION_FAILED';
        message = `Precondition failed: ${context}`;
        break;
    }

    throw new StorageError(message, code, statusCode);
  }
}

// ============================================================================
// Games Storage
// ============================================================================

export class GamesStorage extends BaseStorageClient {
  constructor() {
    super('Games');
  }

  /**
   * Create a new game
   */
  async createGame(
    gameId: string,
    hostKey: string,
    boardData: BoardData,
    defaultRoundDurationMs: number,
    gameName?: string
  ): Promise<Game> {
    try {
      const entity: GameEntity & TableEntity = {
        partitionKey: 'GAME',
        rowKey: gameId,
        hostKey,
        gameName,
        createdAt: Date.now(),
        defaultRoundDurationMs,
        totalRounds: 0,
        boardData: JSON.stringify(boardData)
      };

      await this.tableClient.createEntity(entity);

      return this.parseGame(entity);
    } catch (error) {
      this.handleError(error, `createGame(${gameId})`);
    }
  }

  /**
   * Get a game by ID
   */
  async getGame(gameId: string): Promise<Game> {
    try {
      const entity = await this.tableClient.getEntity<GameEntity & TableEntity>(
        'GAME',
        gameId
      );
      return this.parseGame(entity);
    } catch (error) {
      this.handleError(error, `getGame(${gameId})`);
    }
  }

  /**
   * Update game properties
   */
  async updateGame(
    gameId: string,
    updates: Partial<{
      currentRoundId: string | null;
      totalRounds: number;
      board: BoardData;
    }>
  ): Promise<void> {
    try {
      const entity: TableEntity & Partial<GameEntity> = {
        partitionKey: 'GAME',
        rowKey: gameId
      };

      if (updates.currentRoundId !== undefined) {
        entity.currentRoundId = updates.currentRoundId || undefined;
      }
      if (updates.totalRounds !== undefined) {
        entity.totalRounds = updates.totalRounds;
      }
      if (updates.board !== undefined) {
        entity.boardData = JSON.stringify(updates.board);
      }

      await this.tableClient.updateEntity(entity, 'Merge');
    } catch (error) {
      this.handleError(error, `updateGame(${gameId})`);
    }
  }

  /**
   * Verify host key for authentication
   */
  async verifyHostKey(gameId: string, hostKey: string): Promise<boolean> {
    try {
      const game = await this.getGame(gameId);
      return game.hostKey === hostKey;
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Parse entity to Game object
   */
  private parseGame(entity: GameEntity & TableEntity): Game {
    return {
      gameId: entity.rowKey,
      hostKey: entity.hostKey,
      gameName: entity.gameName,
      createdAt: entity.createdAt,
      defaultRoundDurationMs: entity.defaultRoundDurationMs,
      currentRoundId: entity.currentRoundId,
      totalRounds: entity.totalRounds,
      board: JSON.parse(entity.boardData)
    };
  }
}

// ============================================================================
// Rounds Storage
// ============================================================================

export class RoundsStorage extends BaseStorageClient {
  constructor() {
    super('Rounds');
  }

  /**
   * Create a new round
   */
  async createRound(
    gameId: string,
    roundId: string,
    roundData: {
      roundNumber: number;
      goalIndex: number;
      goal: Goal;
      robotPositions: Robots;
      startTime: number;
      endTime: number;
      durationMs: number;
      createdBy: 'host' | 'timer';
    }
  ): Promise<Round> {
    try {
      const entity: RoundEntity & TableEntity = {
        partitionKey: gameId,
        rowKey: roundId,
        roundNumber: roundData.roundNumber,
        goalIndex: roundData.goalIndex,
        goalColor: roundData.goal.color,
        goalPosition: JSON.stringify(roundData.goal.position),
        robotPositions: JSON.stringify(roundData.robotPositions),
        startTime: roundData.startTime,
        endTime: roundData.endTime,
        durationMs: roundData.durationMs,
        status: 'active',
        createdBy: roundData.createdBy
      };

      await this.tableClient.createEntity(entity);

      return this.parseRound(entity);
    } catch (error) {
      this.handleError(error, `createRound(${gameId}, ${roundId})`);
    }
  }

  /**
   * Get a specific round
   */
  async getRound(gameId: string, roundId: string): Promise<Round> {
    try {
      const entity = await this.tableClient.getEntity<RoundEntity & TableEntity>(
        gameId,
        roundId
      );
      return this.parseRound(entity);
    } catch (error) {
      this.handleError(error, `getRound(${gameId}, ${roundId})`);
    }
  }

  /**
   * Update round properties
   */
  async updateRound(
    gameId: string,
    roundId: string,
    updates: Partial<{
      status: 'active' | 'completed' | 'skipped';
      endTime: number;
    }>
  ): Promise<void> {
    try {
      const entity: TableEntity & Partial<RoundEntity> = {
        partitionKey: gameId,
        rowKey: roundId,
        ...updates
      };

      await this.tableClient.updateEntity(entity, 'Merge');
    } catch (error) {
      this.handleError(error, `updateRound(${gameId}, ${roundId})`);
    }
  }

  /**
   * Get the active round for a game
   */
  async getActiveRound(gameId: string): Promise<Round | null> {
    try {
      const filter = odata`PartitionKey eq ${gameId} and status eq 'active'`;
      const entities = this.tableClient.listEntities<RoundEntity & TableEntity>({
        queryOptions: { filter }
      });

      for await (const entity of entities) {
        return this.parseRound(entity);
      }

      return null;
    } catch (error) {
      this.handleError(error, `getActiveRound(${gameId})`);
    }
  }

  /**
   * Get all rounds for a game (sorted by round number)
   */
  async getAllRounds(gameId: string): Promise<Round[]> {
    try {
      const filter = odata`PartitionKey eq ${gameId}`;
      const entities = this.tableClient.listEntities<RoundEntity & TableEntity>({
        queryOptions: { filter }
      });

      const rounds: Round[] = [];
      for await (const entity of entities) {
        rounds.push(this.parseRound(entity));
      }

      // Sort by round number
      rounds.sort((a, b) => a.roundNumber - b.roundNumber);

      return rounds;
    } catch (error) {
      this.handleError(error, `getAllRounds(${gameId})`);
    }
  }

  /**
   * Get all expired active rounds (for timer function)
   */
  async getExpiredRounds(currentTime: number): Promise<Round[]> {
    try {
      const filter = odata`status eq 'active' and endTime lt ${currentTime}`;
      const entities = this.tableClient.listEntities<RoundEntity & TableEntity>({
        queryOptions: { filter }
      });

      const rounds: Round[] = [];
      for await (const entity of entities) {
        rounds.push(this.parseRound(entity));
      }

      return rounds;
    } catch (error) {
      this.handleError(error, `getExpiredRounds(${currentTime})`);
    }
  }

  /**
   * Parse entity to Round object
   */
  private parseRound(entity: RoundEntity & TableEntity): Round {
    return {
      gameId: entity.partitionKey,
      roundId: entity.rowKey,
      roundNumber: entity.roundNumber,
      goalIndex: entity.goalIndex,
      goal: {
        position: JSON.parse(entity.goalPosition),
        color: entity.goalColor as any
      },
      robotPositions: JSON.parse(entity.robotPositions),
      startTime: entity.startTime,
      endTime: entity.endTime,
      durationMs: entity.durationMs,
      status: entity.status,
      createdBy: entity.createdBy
    };
  }
}

// ============================================================================
// Solutions Storage
// ============================================================================

export class SolutionsStorage extends BaseStorageClient {
  constructor() {
    super('Solutions');
  }

  /**
   * Submit a new solution (supports multiple submissions per player)
   */
  async submitSolution(
    gameId: string,
    roundId: string,
    playerName: string,
    solution: {
      displayName: string;
      moveCount: number;
      winningRobot: RobotColorValue;
      moves: Move[];
    }
  ): Promise<Solution> {
    try {
      const submittedAt = Date.now();
      const normalizedName = playerName.toLowerCase().trim();

      const entity: SolutionEntity & TableEntity = {
        partitionKey: `${gameId}_${roundId}`,
        rowKey: `${normalizedName}_${submittedAt}`,
        displayName: solution.displayName,
        moveCount: solution.moveCount,
        winningRobot: solution.winningRobot,
        solutionData: JSON.stringify(solution.moves),
        submittedAt
      };

      await this.tableClient.createEntity(entity);

      return this.parseSolution(entity, gameId, roundId);
    } catch (error) {
      this.handleError(error, `submitSolution(${gameId}, ${roundId}, ${playerName})`);
    }
  }

  /**
   * Get all solutions for a specific player in a round
   */
  async getPlayerSolutions(
    gameId: string,
    roundId: string,
    playerName: string
  ): Promise<Solution[]> {
    try {
      const partitionKey = `${gameId}_${roundId}`;
      const normalizedName = playerName.toLowerCase().trim();
      const entities = this.tableClient.listEntities<SolutionEntity & TableEntity>({
        queryOptions: { filter: odata`PartitionKey eq ${partitionKey}` }
      });

      const solutions: Solution[] = [];
      for await (const entity of entities) {
        // Extract player name from rowKey (format: playerName_timestamp)
        const playerFromRowKey = entity.rowKey.substring(0, entity.rowKey.lastIndexOf('_'));
        if (playerFromRowKey === normalizedName) {
          solutions.push(this.parseSolution(entity, gameId, roundId));
        }
      }

      // Sort by submission time
      solutions.sort((a, b) => a.submittedAt - b.submittedAt);

      return solutions;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return [];
      }
      this.handleError(error, `getPlayerSolutions(${gameId}, ${roundId}, ${playerName})`);
    }
  }

  /**
   * Get all solutions for a round (for leaderboard)
   */
  async getLeaderboard(gameId: string, roundId: string): Promise<Solution[]> {
    try {
      const partitionKey = `${gameId}_${roundId}`;
      const filter = odata`PartitionKey eq ${partitionKey}`;
      const entities = this.tableClient.listEntities<SolutionEntity & TableEntity>({
        queryOptions: { filter }
      });

      const solutions: Solution[] = [];
      for await (const entity of entities) {
        solutions.push(this.parseSolution(entity, gameId, roundId));
      }

      // Sort by move count, then by submission time
      solutions.sort((a, b) => {
        if (a.moveCount !== b.moveCount) {
          return a.moveCount - b.moveCount;
        }
        return a.submittedAt - b.submittedAt;
      });

      return solutions;
    } catch (error) {
      // Handle 404 errors gracefully - can occur if table doesn't exist yet
      // or if querying an empty/newly created table before it's fully available
      if (error && (error as any).statusCode === 404) {
        return [];
      }
      this.handleError(error, `getLeaderboard(${gameId}, ${roundId})`);
    }
  }

  /**
   * Get count of solutions for a round
   */
  async getSolutionCount(gameId: string, roundId: string): Promise<number> {
    try {
      const solutions = await this.getLeaderboard(gameId, roundId);
      return solutions.length;
    } catch (error) {
      this.handleError(error, `getSolutionCount(${gameId}, ${roundId})`);
    }
  }

  /**
   * Get count of submissions for a specific player
   */
  async getPlayerSubmissionCount(
    gameId: string,
    roundId: string,
    playerName: string
  ): Promise<number> {
    const solutions = await this.getPlayerSolutions(gameId, roundId, playerName);
    return solutions.length;
  }

  /**
   * Parse entity to Solution object
   */
  private parseSolution(
    entity: SolutionEntity & TableEntity,
    gameId: string,
    roundId: string
  ): Solution {
    // Extract player name from rowKey (format: playerName_timestamp)
    const playerName = entity.rowKey.substring(0, entity.rowKey.lastIndexOf('_'));
    
    return {
      gameId,
      roundId,
      playerName,
      displayName: entity.displayName,
      moveCount: entity.moveCount,
      winningRobot: entity.winningRobot,
      moves: JSON.parse(entity.solutionData),
      submittedAt: entity.submittedAt
    };
  }
}

// ============================================================================
// Storage Factory
// ============================================================================

/**
 * Factory for creating storage clients
 */
export class Storage {
  private static _games: GamesStorage;
  private static _rounds: RoundsStorage;
  private static _solutions: SolutionsStorage;

  static get games(): GamesStorage {
    if (!this._games) {
      this._games = new GamesStorage();
    }
    return this._games;
  }

  static get rounds(): RoundsStorage {
    if (!this._rounds) {
      this._rounds = new RoundsStorage();
    }
    return this._rounds;
  }

  static get solutions(): SolutionsStorage {
    if (!this._solutions) {
      this._solutions = new SolutionsStorage();
    }
    return this._solutions;
  }

  /**
   * Initialize all tables (create if they don't exist)
   * Called at app startup to pre-create tables during function warmup
   */
  static async initialize(): Promise<void> {
    await Promise.all([
      this.games.ensureTable(),
      this.rounds.ensureTable(),
      this.solutions.ensureTable()
    ]);
  }
}
