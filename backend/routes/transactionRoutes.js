import express from "express";
import {
  getTransactions,
  getTransaction,
  updateTransaction,
  verifyTransaction,
  getTransactionStats,
} from "../controllers/transactionController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics for current user
 * @access  Private
 */
router.get("/stats", getTransactionStats);

/**
 * @route   GET /api/transactions
 * @desc    Get transactions for current user
 * @query   role (supplier|receiver|all), status, page, limit, sortBy, sortOrder
 * @access  Private
 */
router.get("/", getTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction
 * @access  Private (supplier or receiver only)
 */
router.get("/:id", getTransaction);

/**
 * @route   PATCH /api/transactions/:id
 * @desc    Update transaction (schedule, confirm, dispute, cancel, add_note, add_photo)
 * @body    action (required), plus action-specific fields
 * @access  Private
 */
router.patch("/:id", updateTransaction);

/**
 * @route   POST /api/transactions/:id/verify
 * @desc    Verify transaction with code (for pickup)
 * @body    code (required)
 * @access  Private (receiver only)
 */
router.post("/:id/verify", verifyTransaction);

export default router;
