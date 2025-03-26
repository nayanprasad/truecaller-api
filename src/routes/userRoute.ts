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

// Profile routes
router.get("/profile", cacheMiddleware(300, CACHE_PREFIXES.USER), getProfile);
router.patch("/profile", updateProfile);

// Contact routes
router.get(
  "/contacts",
  cacheMiddleware(300, CACHE_PREFIXES.CONTACT),
  getContacts,
);
router.get(
  "/contacts/all",
  cacheMiddleware(300, CACHE_PREFIXES.CONTACT),
  getAllContacts,
);
router.post("/contacts/new", addContact);
router.get(
  "/contacts/:id",
  cacheMiddleware(300, CACHE_PREFIXES.CONTACT),
  getContact,
);
router.patch("/contacts/:id", updateContact);
router.delete("/contacts/:id", deleteContact);

// Report spam route
router.post("/report-spam", reportSpam);

export default router;
