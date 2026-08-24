import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { startCronJobs } from "./services/cron.service";
import { initSocketServer } from "./socket";

import authRoutes from "./modules/auth/routes";
import userRoutes from "./modules/users/routes";
import leadRoutes from "./modules/leads/routes";
import serviceRoutes from "./modules/services/routes";
import projectRoutes from "./modules/projects/routes";
import quoteRoutes from "./modules/quotes/routes";
import invoiceRoutes from "./modules/invoices/routes";
import messageRoutes from "./modules/messages/routes";
import reviewRoutes from "./modules/reviews/routes";
import notificationRoutes from "./modules/notifications/routes";
import cmsRoutes from "./modules/cms/routes";
import blogRoutes from "./modules/blog/routes";
import activityLogRoutes from "./modules/activity_log/routes";
import analyticsRoutes from "./modules/analytics/routes";
import uploadRoutes from "./modules/uploads/routes";
import proposalRoutes from "./modules/proposals/routes";
import caseStudyRoutes from "./modules/case-studies/routes";
import roleRoutes from "./modules/roles/routes";
import permissionRoutes from "./modules/permissions/routes";
import supportRoutes from "./modules/support/routes";
import financeRoutes from "./modules/finance/routes";
import hrRoutes from "./modules/hr/routes";
import salesRoutes from "./modules/sales/routes";
import taskRoutes from "./modules/tasks/routes";
import pricingRoutes from "./modules/pricing/routes";
import budgetOptionRoutes from "./modules/budget-options/routes";
import paymentRoutes from "./modules/payments/routes";
import settingsRoutes from "./modules/settings/routes";
import chatbotRoutes from "./modules/chatbot/routes";

const app = express();
const httpServer = http.createServer(app);

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
      "http://localhost:3000",
      "https://inveradigitalagency.com",
      "https://www.inveradigitalagency.com",
    ],
    credentials: true,
  }),
);
app.use(cookieParser());

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("dev"));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/activity-log", activityLogRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/case-studies", caseStudyRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/budget-options", budgetOptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chatbot", chatbotRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Invera Digital Agency API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  const uploadsDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await connectDB();
  startCronJobs();
  initSocketServer(httpServer);
  httpServer.listen(env.port, () => {
    logger.info(`Invera Digital Agency API running on port ${env.port}`);
  });
}

start();

export default app;
