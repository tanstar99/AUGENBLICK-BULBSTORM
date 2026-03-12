import express from "express";
import {
  getDashboard,
  getUserImpact,
  getLeaderboard,
  trackEvent,
  calculateImpact,
  getPlatformStats,
  getLogisticsStats,
} from "../controllers/analyticsController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/analytics/stats
 * @desc    Get aggregated platform statistics (public)
 * @access  Public
 */
router.get("/stats", getPlatformStats);

/**
 * @route   GET /api/analytics/leaderboard
 * @desc    Get platform-wide sustainability leaderboard
 * @query   metric (co2Saved|weightDiverted|totalTransactions), limit
 * @access  Public (with optional auth for user position)
 */
router.get("/leaderboard", optionalAuth, getLeaderboard);

/**
 * @route   POST /api/analytics/events
 * @desc    Track an analytics event
 * @body    eventType, entities, properties, context, device, sessionId
 * @access  Public (with optional auth)
 */
router.post("/events", optionalAuth, trackEvent);

/**
 * @route   POST /api/analytics/calculate-impact
 * @desc    Calculate estimated sustainability impact for a material
 * @body    categoryId, weightKg, quantity, unit
 * @access  Private
 */
router.post("/calculate-impact", authenticate, calculateImpact);

// ========================================
// Authenticated routes below
// ========================================
router.use(authenticate);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get sustainability dashboard with user and platform metrics
 * @query   period (week|month|year|all)
 * @access  Private
 * 
 * Returns:
 *   - User metrics: reuse count, waste diverted, CO2 saved
 *   - Platform metrics: total impact, active listings, users
 *   - Category breakdown: impact by material category
 *   - Environmental equivalents: trees, cars off road, etc.
 */
router.get("/dashboard", getDashboard);

/**
 * @route   GET /api/analytics/impact
 * @desc    Get detailed sustainability impact for current user
 * @access  Private
 * 
 * Returns:
 *   - Summary: total transactions, waste diverted, CO2 saved
 *   - Ranking: user position on leaderboard
 *   - Monthly breakdown: impact over time
 */
router.get("/impact", getUserImpact);

/**
 * @route   GET /api/analytics/logistics
 * @desc    Get logistics statistics for current user
 * @access  Private
 */
router.get("/logistics", getLogisticsStats);

export default router;
