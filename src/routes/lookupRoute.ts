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

/**
 * @swagger
 * components:
 *   schemas:
 *     SpamInfo:
 *       type: object
 *       properties:
 *         isLikelySpam:
 *           type: boolean
 *           description: Whether the number is likely to be spam
 *         reportCount:
 *           type: integer
 *           description: Number of times this number has been reported as spam
 *         spamLikelihood:
 *           type: number
 *           description: Score from 0-100 indicating spam likelihood
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         totalCount:
 *           type: integer
 *           description: Total number of results
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *         currentPage:
 *           type: integer
 *           description: Current page number
 *         pageSize:
 *           type: integer
 *           description: Number of items per page
 *         hasNextPage:
 *           type: boolean
 *           description: Whether there is a next page
 *         hasPrevPage:
 *           type: boolean
 *           description: Whether there is a previous page
 *     SearchResponseDataItem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Contact name
 *         phoneNumber:
 *           type: string
 *           description: Phone number
 *         spamInfo:
 *           $ref: '#/components/schemas/SpamInfo'
 *     DetailedPhoneInfo:
 *       type: object
 *       properties:
 *         phoneNumber:
 *           type: string
 *           description: The phone number
 *         registeredUser:
 *           type: object
 *           nullable: true
 *           properties:
 *             name:
 *               type: string
 *               description: User's name
 *             phoneNumber:
 *               type: string
 *               description: User's phone number
 *             email:
 *               type: string
 *               description: User's email (only shown if requester is in user's contacts)
 *         savedAs:
 *           type: array
 *           description: Different names this number has been saved as by other users
 *           items:
 *             type: string
 *         spamInfo:
 *           $ref: '#/components/schemas/SpamInfo'
 */

/**
 * @swagger
 * tags:
 *   - name: Lookup
 *     description: Phone number lookup and search operations
 *   - name: Premium
 *     description: Premium features requiring authentication
 */

/**
 * @swagger
 * /lookup/search/name:
 *   get:
 *     summary: Search for contacts by name
 *     tags: [Lookup]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Name to search for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *         default: 10
 *     responses:
 *       200:
 *         description: List of contacts matching the name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchResponseDataItem'
 *       400:
 *         description: Bad request
 *       429:
 *         description: Too many requests
 */
router.get(
  "/search/name",
  cacheMiddleware(300, CACHE_PREFIXES.SEARCH),
  searchByName,
);

/**
 * @swagger
 * /lookup/search/phone:
 *   get:
 *     summary: Search for contacts by phone number
 *     tags: [Lookup]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone number to search for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *         default: 10
 *     responses:
 *       200:
 *         description: Contact information matching the phone number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchResponseDataItem'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Phone number not found
 *       429:
 *         description: Too many requests
 */
router.get(
  "/search/phone",
  cacheMiddleware(300, CACHE_PREFIXES.SEARCH),
  searchByPhone,
);

/**
 * @swagger
 * /lookup/details/{phoneNumber}:
 *   get:
 *     summary: Get detailed information about a phone number
 *     tags: [Lookup]
 *     parameters:
 *       - in: path
 *         name: phoneNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone number to get details for
 *     responses:
 *       200:
 *         description: Detailed information about the phone number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DetailedPhoneInfo'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Phone number not found
 *       429:
 *         description: Too many requests
 */
router.get(
  "/details/:phoneNumber",
  cacheMiddleware(600, CACHE_PREFIXES.USER),
  getDetailedInfo,
);

/**
 * @swagger
 * /lookup/premium/search/name:
 *   get:
 *     summary: Premium search for contacts by name with enhanced results
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Name to search for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *         default: 10
 *     responses:
 *       200:
 *         description: Enhanced list of contacts matching the name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                       email:
 *                         type: string
 *                       address:
 *                         type: string
 *                       spamInfo:
 *                         $ref: '#/components/schemas/SpamInfo'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
router.get(
  "/premium/search/name",
  isAuthenticated,
  rateLimitMiddleware({ maxRequests: 500 }),
  cacheMiddleware(300, CACHE_PREFIXES.SEARCH),
  searchByName,
);

export default router;