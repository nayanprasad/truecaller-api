import { createClient, RedisClientType } from "redis";

// Redis connection options
const redisOptions = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries: number) => {
      const delay = Math.min(Math.pow(2, retries) * 100, 3000);
      return delay;
    },
  },
};

class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = createClient(redisOptions);

      // Set up event listeners
      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("ready", () => {
        console.log("Redis client connected and ready");
        this.isConnected = true;
      });

      this.client.on("reconnecting", () => {
        console.log("Redis client reconnecting");
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.quit();
      this.isConnected = false;
      console.log("Redis client disconnected");
    } catch (error) {
      console.error("Error disconnecting from Redis:", error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client!.get(key);
  }

  public async set(
    key: string,
    value: string,
    expiryInSeconds?: number,
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    if (expiryInSeconds) {
      await this.client!.set(key, value, { EX: expiryInSeconds });
    } else {
      await this.client!.set(key, value);
    }
  }

  public async del(...keys: string[]): Promise<void> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    if (keys.length > 0) {
      await this.client!.del(keys);
    }
  }

  /**
   * Find keys matching a pattern
   * @param pattern Pattern to match (e.g., "user:*")
   * @returns Array of matching keys
   */
  public async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client!.keys(pattern);
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    const result = await this.client!.exists(key);
    return result === 1;
  }

  public async setHash(
    key: string,
    field: string,
    value: string,
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    await this.client!.hSet(key, field, value);
  }

  public async getHash(
    key: string,
    field: string,
  ): Promise<string | null | undefined> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client!.hGet(key, field);
  }

  public async getAllHash(key: string): Promise<Record<string, string>> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client!.hGetAll(key);
  }

  public async setJson<T>(
    key: string,
    value: T,
    expiryInSeconds?: number,
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), expiryInSeconds);
  }

  public async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error parsing JSON from Redis key ${key}:`, error);
      return null;
    }
  }

  // Method for handling rate limiting
  public async incrementAndCheck(
    key: string,
    limit: number,
    windowInSeconds: number,
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }

    const current = await this.client!.incr(key);

    // If this is the first request in the window, set the expiry
    if (current === 1) {
      await this.client!.expire(key, windowInSeconds);
    }

    // Return true if under the limit, false otherwise
    return current <= limit;
  }
}

const redisService = RedisService.getInstance();
redisService.connect().catch(console.error);

export default redisService;
