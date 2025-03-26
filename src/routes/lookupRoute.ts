import express from "express";
import {
  getDetailedInfo,
  lookupPhone,
  searchByName,
  searchByPhone,
} from "@/controllers/lookupController.js";

const router = express.Router();

// Public routes - can be accessed without authentication
router.post("/phone", lookupPhone);
router.get("/search/name", searchByName);
router.get("/search/phone", searchByPhone);
router.get("/details/:phoneNumber", getDetailedInfo);

export default router;