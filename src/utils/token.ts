import crypto from "crypto";
import prisma from "@/config/database.js";

/**
 * Generates a random token for user authentication
 * @param userId The user Id to associate with the token
 * @returns The generated token
 */
export const generateToken = (userId: string): string => {
  // Generate a random token (32 bytes = 64 hex characters)
  return `${userId}.${crypto.randomBytes(32).toString("hex")}`;
};

/**
 * Verifies token and returns the associated user Id
 * @param token The token to verify
 * @returns Promise resolving to the user ID if valid, null otherwise
 */
export const verifyToken = async (token: string): Promise<string | null> => {
  // Check if token exists and is not expired
  const session = await prisma.session.findFirst({
    where: {
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!session) {
    return null;
  }

  return session.userId;
};
