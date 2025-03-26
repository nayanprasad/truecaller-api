import express from "express";
import {
  getDetailedInfo,
  searchByName,
  searchByPhone,
} from "@/controllers/lookupController.js";
import { CACHE_PREFIXES, cacheMiddleware } from "@/middlewares/cache.js";
import { rateLimitMiddleware } from "@/middlewares/rateLimit.js";
import { isAuthenticated } from "@/middlewares/auth.js";

const router = express.Router();

// Apply rate limiting to all lookup routes
router.use(rateLimitMiddleware());

// Add caching to search endpoints (5 minutes TTL)
router.get(
  "/search/name",
  cacheMiddleware(300, CACHE_PREFIXES.SEARCH),
  searchByName,
);
router.get(
  "/search/phone",
  cacheMiddleware(300, CACHE_PREFIXES.SEARCH),
  searchByPhone,
);

// Phone details caching (10 minutes TTL)
router.get(
  "/details/:phoneNumber",
  cacheMiddleware(600, CACHE_PREFIXES.USER),
  getDetailedInfo,
);

// Premium endpoints with stricter rate limits and authentication
router.get(
  "/premium/search/name",
  isAuthenticated,
  rateLimitMiddleware({ maxRequests: 500 }),
  cacheMiddleware(300, CACHE_PREFIXES.SEARCH),
  searchByName,
);

export default router;