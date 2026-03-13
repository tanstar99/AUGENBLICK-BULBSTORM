import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import logisticsRoutes from "./routes/logisticsRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import imageStudioRoutes from "./routes/imageStudioRoutes.js";
import whapiRoutes from "./routes/whapiRoutes.js";

// Initialize Express app
const app = express();

// CORS configuration - MUST be before helmet
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Image-Path"],
  })
);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Logging middleware
app.use(morgan("dev"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Circular Economy Marketplace API is running",
    version: "1.0.0",
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ===================
// Routes
// ===================
app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/image-studio", imageStudioRoutes);
app.use("/api/whapi", whapiRoutes);

// Static serving for AI Image Studio 3D models
const __filename_app = fileURLToPath(import.meta.url);
const __dirname_app = path.dirname(__filename_app);
app.use("/image-studio-models", express.static(path.resolve(__dirname_app, "image-studio-models")));

// Placeholder routes (to be implemented)
// import userRoutes from "./routes/userRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";

// app.use("/api/users", userRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/notifications", notificationRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ===================
// Global Error Handler
// ===================
app.use((err, req, res, next) => {
  // Log error details
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  
  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(", ");
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // MongoDB Connection Errors
  if (err.name === "MongoNetworkError") {
    statusCode = 503;
    message = "Database connection error";
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File too large";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected file field";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

export default app;
