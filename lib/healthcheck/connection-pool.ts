import { MongoClient } from "mongodb";
import type Redis from "ioredis";

/**
 * Connection Pool Manager
 * Manages persistent connections for MongoDB and Redis to improve health check performance
 */
class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private mongoPools: Map<string, MongoClient> = new Map();
  private redisPools: Map<string, Redis> = new Map();

  private constructor() {}

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  /**
   * Get or create a MongoDB client from the pool
   */
  async getMongoClient(
    connectionString: string,
    timeout: number,
  ): Promise<MongoClient> {
    const key = connectionString;

    if (!this.mongoPools.has(key)) {
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: timeout,
        connectTimeoutMS: timeout,
        maxPoolSize: 1,
        minPoolSize: 1,
      });
      await client.connect();
      this.mongoPools.set(key, client);
      console.log(`[ConnectionPool] Created MongoDB pool for ${key}`);
    }

    return this.mongoPools.get(key)!;
  }

  /**
   * Get or create a Redis client from the pool
   */
  async getRedisClient(
    connectionString: string,
    options: {
      password?: string;
      database?: number;
      timeout?: number;
    },
  ): Promise<Redis> {
    const Redis = (await import("ioredis")).default;
    const key = `${connectionString}:${options.database || 0}`;

    if (!this.redisPools.has(key)) {
      const client = new Redis(connectionString, {
        password: options.password,
        db: options.database || 0,
        connectTimeout: options.timeout || 5000,
        commandTimeout: options.timeout || 5000,
        lazyConnect: false,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });

      // Handle errors to prevent crashes
      client.on("error", (err) => {
        console.error(`[ConnectionPool] Redis error for ${key}:`, err.message);
      });

      this.redisPools.set(key, client);
      console.log(`[ConnectionPool] Created Redis pool for ${key}`);
    }

    return this.redisPools.get(key)!;
  }

  /**
   * Clean up all connections
   */
  async cleanup(): Promise<void> {
    console.log("[ConnectionPool] Cleaning up all connections...");

    // Close all MongoDB connections
    for (const [key, client] of this.mongoPools.entries()) {
      try {
        await client.close();
        console.log(`[ConnectionPool] Closed MongoDB pool for ${key}`);
      } catch (error) {
        console.error(
          `[ConnectionPool] Error closing MongoDB pool for ${key}:`,
          error,
        );
      }
    }
    this.mongoPools.clear();

    // Close all Redis connections
    for (const [key, client] of this.redisPools.entries()) {
      try {
        client.disconnect();
        console.log(`[ConnectionPool] Closed Redis pool for ${key}`);
      } catch (error) {
        console.error(
          `[ConnectionPool] Error closing Redis pool for ${key}:`,
          error,
        );
      }
    }
    this.redisPools.clear();

    console.log("[ConnectionPool] Cleanup complete");
  }

  /**
   * Remove a specific MongoDB connection from the pool
   */
  async removeMongoClient(connectionString: string): Promise<void> {
    const client = this.mongoPools.get(connectionString);
    if (client) {
      await client.close();
      this.mongoPools.delete(connectionString);
      console.log(
        `[ConnectionPool] Removed MongoDB pool for ${connectionString}`,
      );
    }
  }

  /**
   * Remove a specific Redis connection from the pool
   */
  removeRedisClient(connectionString: string, database: number = 0): void {
    const key = `${connectionString}:${database}`;
    const client = this.redisPools.get(key);
    if (client) {
      client.disconnect();
      this.redisPools.delete(key);
      console.log(`[ConnectionPool] Removed Redis pool for ${key}`);
    }
  }
  /**
   * Invalidate connections for a service when its configuration changes
   * This ensures stale connections are removed and fresh ones are created
   */
  async invalidateServiceConnections(
    serviceType: string,
    oldConfig?: {
      mongoConnectionString?: string;
      redisConnectionString?: string;
      redisDatabase?: number;
    },
    newConfig?: {
      mongoConnectionString?: string;
      redisConnectionString?: string;
      redisDatabase?: number;
    },
  ): Promise<void> {
    console.log(
      `[ConnectionPool] Invalidating connections for ${serviceType} service`,
    );

    if (serviceType === "mongodb") {
      // Remove old MongoDB connection if it changed
      if (oldConfig?.mongoConnectionString) {
        if (
          !newConfig?.mongoConnectionString ||
          oldConfig.mongoConnectionString !== newConfig.mongoConnectionString
        ) {
          await this.removeMongoClient(oldConfig.mongoConnectionString);
        }
      }
    } else if (serviceType === "redis") {
      // Remove old Redis connection if it changed
      if (oldConfig?.redisConnectionString) {
        const oldDb = oldConfig.redisDatabase || 0;
        const newDb = newConfig?.redisDatabase || 0;
        const connectionChanged =
          !newConfig?.redisConnectionString ||
          oldConfig.redisConnectionString !== newConfig.redisConnectionString;
        const databaseChanged = oldDb !== newDb;

        if (connectionChanged || databaseChanged) {
          this.removeRedisClient(oldConfig.redisConnectionString, oldDb);
        }
      }
    }
  }
}

export const connectionPool = ConnectionPoolManager.getInstance();
