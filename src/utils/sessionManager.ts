import crypto from "crypto";
import redisService from "@/config/redis";
import prisma from "@/config/database";

const SESSION_TTL = parseInt(process.env.SESSION_TTL || "2592000"); // 30 days;

/**
 * Creates a session for a user and stores it in Redis and database
 * @param userId The ID of the user
 * @param additionalData Additional session data to store
 * @param ttl Time to live in seconds
 * @returns The generated session token
 */
export const createSession = async (
  userId: string,
  additionalData: Record<string, any> = {},
  ttl: number = SESSION_TTL,
): Promise<string> => {
  // Generate a random token
  const token = `${userId}.${crypto.randomBytes(32).toString("hex")}`;

  // Calculate expiry date
  const expiresAt = new Date(Date.now() + ttl * 1000);

  // Store session data in Redis
  const sessionData = {
    userId,
    createdAt: new Date().toISOString(),
    ...additionalData,
  };

  await redisService.setJson(`session:${token}`, sessionData, ttl);

  // Also store in database for persistence
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
};

/**
 * Validates a session token and returns the associated user ID
 * @param token The session token to validate
 * @returns The user ID if session is valid, null otherwise
 */
export const validateSession = async (
  token: string,
): Promise<string | null> => {
  if (!token) return null;

  try {
    // First try to get session data from Redis
    const sessionData = await redisService.getJson<{ userId: string }>(
      `session:${token}`,
    );

    if (sessionData) {
      return sessionData.userId;
    }

    // If not in Redis, try to fetch from database
    const dbSession = await prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });

    // If session exists and has not expired
    if (dbSession && dbSession.expiresAt > new Date()) {
      // Re-populate Redis with this session
      await redisService.setJson(
        `session:${token}`,
        { userId: dbSession.userId },
        Math.floor((dbSession.expiresAt.getTime() - Date.now()) / SESSION_TTL),
      );

      return dbSession.userId;
    }

    return null;
  } catch (error) {
    console.error("Error validating session:", error);
    return null;
  }
};

/**
 * Invalidates a session by removing it from Redis
 * @param token The session token to invalidate
 */
export const invalidateSession = async (token: string): Promise<void> => {
  if (!token) return;
  try {
    // Remove session data from Redis
    await redisService.del(`session:${token}`);

    // Delete the session
    await prisma.session.deleteMany({
      where: { token },
    });
  } catch (error) {
    console.error("Error invalidating session:", error);
  }
};
