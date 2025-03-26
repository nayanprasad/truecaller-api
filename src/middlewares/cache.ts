import { NextFunction, Request, Response } from "express";
import redisService from "@/config/redis.js";

const DEFAULT_CACHE_TTL = parseInt(process.env.REDIS_TTL || "3600"); // 1 hour

/**
 * Cache key prefixes for different resources
 */
export const CACHE_PREFIXES = {
  USER: "user",
  CONTACT: "contact",
  SPAM: "spam",
  SEARCH: "search",
};

/**
 * Middleware to cache API responses
 * @param ttl Time to live in seconds
 * @param resourceType Optional resource type for better invalidation
 * @returns Express middleware
 */
export const cacheMiddleware = (
  ttl = DEFAULT_CACHE_TTL,
  resourceType?: string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Create a cache key based on the full URL and any authentication
    const userId = req.user?.id || "anonymous";
    const resource = resourceType || "general";
    const cacheKey = `cache:${resource}:${userId}:${req.originalUrl}`;

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
 * Helper to invalidate cache entries by exact key
 * @param key Exact cache key to invalidate
 */
export const invalidateCacheKey = async (key: string): Promise<void> => {
  try {
    await redisService.del(key);
  } catch (error) {
    console.error(`Error invalidating cache key ${key}:`, error);
  }
};

/**
 * Helper to invalidate cache entries by pattern
 * @param pattern Pattern of keys to invalidate (e.g., 'cache:user:123:*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisService.keys(pattern);
    if (keys.length > 0) {
      await redisService.del(...keys);
      console.log(
        `Invalidated ${keys.length} cache entries matching pattern: ${pattern}`,
      );
    }
  } catch (error) {
    console.error(`Error invalidating cache with pattern ${pattern}:`, error);
  }
};

/**
 * Invalidate cache for a specific resource type
 * @param resourceType Type of resource (e.g., 'user', 'contact')
 * @param resourceId Optional specific resource ID
 */
export const invalidateResourceCache = async (
  resourceType: string,
  resourceId?: string,
): Promise<void> => {
  try {
    const pattern = resourceId
      ? `cache:${resourceType}:*:*${resourceId}*`
      : `cache:${resourceType}:*`;

    await invalidateCache(pattern);
  } catch (error) {
    console.error(
      `Error invalidating cache for resource ${resourceType}:`,
      error,
    );
  }
};

/**
 * Invalidate cache for a specific phone number
 * This is useful when user or contact data changes for a specific phone number
 * @param phoneNumber Phone number to invalidate cache for
 */
export const invalidatePhoneNumberCache = async (
  phoneNumber: string,
): Promise<void> => {
  try {
    // Invalidate any cache entries containing this phone number
    // This covers both lookup and search results
    await invalidateCache(`cache:*:*:*${phoneNumber}*`);
  } catch (error) {
    console.error(
      `Error invalidating cache for phone number ${phoneNumber}:`,
      error,
    );
  }
};
