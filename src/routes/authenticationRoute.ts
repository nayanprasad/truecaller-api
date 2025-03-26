import express from "express";
import {
  login,
  logout,
  register,
} from "@/controllers/authenticationController.js";
import { authRateLimit } from "@/middlewares/rateLimit.js";

const router = express.Router();

// Apply rate limiting middleware to all authentication routes
router.use(authRateLimit);

// Authentication routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
