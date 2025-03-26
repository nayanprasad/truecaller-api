import {NextFunction, Request, Response} from "express";
import ErrorHandler from "@/utils/errorHandler.js";
import prisma from "@/config/database.js";
import {validateSession} from "@/utils/sessionManager.js";

/**
 * Authentication middleware to verify user tokens using Redis sessions
 */
export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ErrorHandler(401, "Authorization token required"));
    }

    const token = authHeader.split(" ")[1];

    // Validate session and get user ID
    const userId = await validateSession(token);
    if (!userId) {
      return next(new ErrorHandler(401, "Invalid or expired token"));
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
      },
    });

    if (!user) {
      return next(new ErrorHandler(401, "User not found"));
    }

    // Attach user to request object
    req.user = user;
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    next(new ErrorHandler(401, "Authentication failed"));
  }
};