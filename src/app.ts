import express from "express";
import helmet from "helmet";
import cors from "cors";
import { errorMiddleware } from "@/middlewares/error.js";
import morgan from "morgan";
import dotenv from "dotenv";
import { authRoutes, lookupRoutes, userRoutes } from "@/routes/index.js";
import redisService from "@/config/redis.js";
import swaggerUi from "swagger-ui-express";
import { specs } from "@/config/swagger.js";

dotenv.config({ path: "./.env" });

export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";
const port = process.env.PORT || 8080;

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: envMode !== "DEVELOPMENT",
    crossOriginEmbedderPolicy: envMode !== "DEVELOPMENT",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: " * ", credentials: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: "Truecaller API Documentation",
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/lookup", lookupRoutes);

app.get("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});

app.use(errorMiddleware);

const server = app.listen(port, () =>
  console.log(`Server is working on Port: ${port} in ${envMode} Mode.`),
);

// Handle graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function gracefulShutdown() {
  console.log("Starting graceful shutdown...");

  // Close the server
  server.close(() => {
    console.log("HTTP server closed");
  });

  try {
    // Disconnect from Redis
    await redisService.disconnect();
    console.log("Redis connection closed");

    // Add any other cleanup tasks here

    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}
