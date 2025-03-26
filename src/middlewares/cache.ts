import { NextFunction, Request, Response } from "express";
import redisService from "@/config/redis.js";

const DEFAULT_CACHE_TTL = parseInt(process.env.REDIS_TTL || "3600"); // 1 hour

/**
 * Middleware to cache API responses
 * @param ttl Time to live in seconds
 * @returns Express middleware
 */
export const cacheMiddleware = (ttl = DEFAULT_CACHE_TTL) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Create a cache key based on the full URL and any authentication
    const userId = req.user?.id || "anonymous";
    const cacheKey = `cache:${userId}:${req.originalUrl}`;

    try {
      // Try to get data from cache
      const cachedData = await redisService.getJson<{
        status: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
      }>(cacheKey);

      if (cachedData) {
        // Cache hit
        return res.status(cachedData.status).json(cachedData.data);
      }

      // Cache miss, continue to the actual route handler but capture the response
      const originalSend = res.send;

      // Adding interceptor to capture the response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.send = function (body: any): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            status: res.statusCode,
            data: JSON.parse(body),
          };

          // Store in Redis
          redisService.setJson(cacheKey, responseData, ttl).catch((err) => {
            console.error("Error caching response:", err);
          });
        }

        // Call the original send method
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Helper to invalidate cache entries
 * @param pattern Pattern of keys to invalidate (e.g., 'cache:user:123:*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    await redisService.del(pattern);
  } catch (error) {
    console.error("Error invalidating cache:", error);
  }
};

/**
 * Helper to invalidate user-specific cache
 * @param userId User ID whose cache should be invalidated
 */
export const invalidateUserCache = async (userId: string): Promise<void> => {
  try {
    await invalidateCache(`cache:${userId}:*`);
  } catch (error) {
    console.error(`Error invalidating cache for user ${userId}:`, error);
  }
};
