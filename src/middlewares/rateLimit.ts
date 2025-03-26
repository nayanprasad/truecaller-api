import { NextFunction, Request, Response } from "express";
import redisService from "@/config/redis.js";
import ErrorHandler from "@/utils/errorHandler.js";

const DEFAULT_WINDOW = parseInt(process.env.REDIS_RATE_LIMIT_WINDOW || "60"); // 60 seconds
const DEFAULT_MAX = parseInt(process.env.REDIS_RATE_LIMIT_MAX || "1"); // 100 requests per window

/**
 * Rate limiting middleware using Redis
 * @param options Rate limiting options
 * @returns Express middleware
 */
export const rateLimitMiddleware = (options?: {
  windowInSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}) => {
  const windowInSeconds = options?.windowInSeconds || DEFAULT_WINDOW;
  const maxRequests = options?.maxRequests || DEFAULT_MAX;
  const keyPrefix = options?.keyPrefix || "rateLimit";

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate a rate limit key based on IP or user ID if authenticated
      const identifier = req.user?.id || req.ip || "unknown";
      const rateLimitKey = `${keyPrefix}:${identifier}`;

      // Check if the request is allowed based on rate limit
      const isAllowed = await redisService.incrementAndCheck(
        rateLimitKey,
        maxRequests,
        windowInSeconds,
      );

      if (!isAllowed) {
        // If rate limit exceeded, return 429 Too Many Requests
        return next(
          new ErrorHandler(429, "Rate limit exceeded. Please try again later."),
        );
      }

      // If within rate limit, add headers and continue
      // Get the current count of requests for this key
      const currentCount = await redisService.get(rateLimitKey);
      const remaining = Math.max(
        0,
        maxRequests - parseInt(currentCount || "0"),
      );

      // Add rate limit headers to the response
      res.set({
        "X-RateLimit-Limit": maxRequests.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": (
          Math.floor(Date.now() / 1000) + windowInSeconds
        ).toString(),
      });

      next();
    } catch (error) {
      console.error("Rate limit middleware error:", error);
      // On error, allow the request to proceed to avoid blocking users
      next();
    }
  };
};

/**
 * Higher rate limit for authenticated users
 */
export const authenticatedRateLimit = rateLimitMiddleware({
  windowInSeconds: DEFAULT_WINDOW,
  maxRequests: DEFAULT_MAX * 2, // Double the limit for authenticated users
  keyPrefix: "rateLimitAuth",
});

/**
 * Stricter rate limit for authentication endpoints to prevent brute force
 */
export const authRateLimit = rateLimitMiddleware({
  windowInSeconds: 300, // 5 minutes
  maxRequests: 10, // 10 requests per 5 minutes
  keyPrefix: "rateLimitAuthEndpoint",
});

/**
 * Very strict rate limit for sensitive operations like password resets
 */
export const sensitiveOperationRateLimit = rateLimitMiddleware({
  windowInSeconds: 3600, // 1 hour
  maxRequests: 5, // 5 requests per hour
  keyPrefix: "rateLimitSensitive",
});
