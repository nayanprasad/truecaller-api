// src/routes/user.ts
import express from "express";
import { isAuthenticated } from "@/middlewares/auth.js";
import {
  addContact,
  deleteContact,
  getAllContacts,
  getContact,
  getContacts,
  getProfile,
  updateContact,
  updateProfile,
} from "@/controllers/userController.js";

const router = express.Router();

// Protected routes - require authentication
router.use(isAuthenticated);

// Profile routes
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

// Contact routes
router.get("/contacts", getContacts);
router.get("/contacts/all", getAllContacts);
router.post("/contacts/new", addContact);
router.get("/contacts/:id", getContact);
router.patch("/contacts/:id", updateContact);
router.delete("/contacts/:id", deleteContact);

export default router;
