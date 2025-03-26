import { Prisma, PrismaClient } from "@prisma/client";

const prismaOptions: Prisma.PrismaClientOptions = {
  log: ["query", "info", "warn", "error"],
};

class PrismaService {
  private static instance: PrismaService;
  private client: PrismaClient | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public getClient(): PrismaClient {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.client!;
  }

  private initialize(): void {
    if (this.isInitialized) return;

    try {
      this.client = new PrismaClient(prismaOptions);
      this.isInitialized = true;
      console.log("Prisma client initialized");
    } catch (error) {
      console.error("Failed to initialize Prisma client:", error);
      throw error;
    }
  }
}

const prismaService = PrismaService.getInstance();
const prisma = prismaService.getClient();

export default prisma;