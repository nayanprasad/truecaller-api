import { NextFunction, Request, Response } from "express";
import { TryCatch } from "@/middlewares/error.js";
import ErrorHandler from "@/utils/errorHandler.js";
import prisma from "@/config/database.js";
import { comparePassword, hashPassword } from "@/utils/password.js";
import { generateToken } from "@/utils/token.js";
import { loginSchema, registerSchema } from "@/models/validators.js";

// Register a new user
export const register = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { name, phoneNumber, email, password } = validation.data;

    // Check if phone number already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      return next(new ErrorHandler(409, "Phone number already registered"));
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        email,
        passwordHash,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Return response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
        },
        token,
      },
    });
  },
);

// Login user
export const login = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { phoneNumber, password } = validation.data;

    // Find user with phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return next(new ErrorHandler(401, "Invalid phone number or password"));
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return next(new ErrorHandler(401, "Invalid phone number or password"));
    }

    // Generate token
    const token = generateToken(user.id);

    // Create or update session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Return response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
        },
        token,
      },
    });
  },
);

// Logout user
export const logout = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new ErrorHandler(400, "Token is required"));
    }

    // Delete the session
    await prisma.session.deleteMany({
      where: { token },
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
);
