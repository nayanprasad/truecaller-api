import express from "express";
import { isAuthenticated } from "@/middlewares/auth.js";
import { CACHE_PREFIXES, cacheMiddleware } from "@/middlewares/cache.js";
import {
  addContact,
  deleteContact,
  getAllContacts,
  getContact,
  getContacts,
  getProfile,
  reportSpam,
  updateContact,
  updateProfile,
} from "@/controllers/userController.js";

const router = express.Router();

// Protected routes - require authentication
router.use(isAuthenticated);

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile and contacts management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's full name
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: User's updated full name (Optional)
 *         email:
 *           type: string
 *           format: email
 *           description: User's updated email address (Optional)
 *     Contact:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Contact ID
 *         name:
 *           type: string
 *           description: Contact's name
 *         phoneNumber:
 *           type: string
 *           description: Contact's phone number
 *         userId:
 *           type: string
 *           description: User ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the contact was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the contact was last updated
 *     AddContactRequest:
 *       type: object
 *       required:
 *         - name
 *         - phoneNumber
 *       properties:
 *         name:
 *           type: string
 *           description: Contact's name
 *         phoneNumber:
 *           type: string
 *           description: Contact's phone number
 *     UpdateContactRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Contact's updated name
 *     ReportSpamRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *       properties:
 *         phoneNumber:
 *           type: string
 *           description: Phone number to report as spam
 *     Pagination:
 *       type: object
 *       properties:
 *         totalCount:
 *           type: integer
 *           description: Total number of items
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
 *     SpamInfo:
 *       type: object
 *       properties:
 *         spamScore:
 *           type: number
 *           description: Spam score (0-100)
 *         reportCount:
 *           type: integer
 *           description: Number of spam reports
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", cacheMiddleware(300, CACHE_PREFIXES.USER), getProfile);

/**
 * @swagger
 * /user/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *      description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.patch("/profile", updateProfile);

/**
 * @swagger
 * /user/contacts:
 *   get:
 *     summary: Get paginated user contacts
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/contacts",
  cacheMiddleware(300, CACHE_PREFIXES.CONTACT),
  getContacts,
);

/**
 * @swagger
 * /user/contacts/all:
 *   get:
 *     summary: Get all user contacts (no pagination)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     responses:
 *       200:
 *         description: List of all contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/contacts/all",
  cacheMiddleware(300, CACHE_PREFIXES.CONTACT),
  getAllContacts,
);

/**
 * @swagger
 * /user/contacts/new:
 *   post:
 *     summary: Add a new contact
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddContactRequest'
 *     responses:
 *       201:
 *         description: Contact added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Contact with this phone number already exists
 */
router.post("/contacts/new", addContact);

/**
 * @swagger
 * /user/contacts/{id}:
 *   get:
 *     summary: Get a specific contact by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 */
router.get(
  "/contacts/:id",
  cacheMiddleware(300, CACHE_PREFIXES.CONTACT),
  getContact,
);

/**
 * @swagger
 * /user/contacts/{id}:
 *   patch:
 *     summary: Update a contact
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContactRequest'
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 */
router.patch("/contacts/:id", updateContact);

/**
 * @swagger
 * /user/contacts/{id}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 */
router.delete("/contacts/:id", deleteContact);

/**
 * @swagger
 * /user/report-spam:
 *   post:
 *     summary: Report a phone number as spam
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Requires authentication with a valid JWT token in the Authorization header (Bearer token)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportSpamRequest'
 *     responses:
 *       201:
 *         description: Number reported as spam successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     spamInfo:
 *                       $ref: '#/components/schemas/SpamInfo'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: You have already reported this number
 */
router.post("/report-spam", reportSpam);

export default router;
