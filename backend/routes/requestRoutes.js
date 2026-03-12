import express from "express";
import {
  createRequest,
  getRequests,
  getRequest,
  updateRequestStatus,
  addMessage,
  addCounterOffer,
} from "../controllers/requestController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/requests
 * @desc    Create a new material request
 * @access  Private
 */
router.post("/", createRequest);

/**
 * @route   GET /api/requests
 * @desc    Get requests (sent, received, or all)
 * @query   type (sent|received|all), status, page, limit, sortBy, sortOrder
 * @access  Private
 */
router.get("/", getRequests);

/**
 * @route   GET /api/requests/:id
 * @desc    Get a single request
 * @access  Private (supplier or requester only)
 */
router.get("/:id", getRequest);

/**
 * @route   PATCH /api/requests/:id/status
 * @desc    Update request status (approve, reject, cancel)
 * @access  Private
 */
router.patch("/:id/status", updateRequestStatus);

/**
 * @route   POST /api/requests/:id/messages
 * @desc    Add a message to request thread
 * @access  Private (supplier or requester only)
 */
router.post("/:id/messages", addMessage);

/**
 * @route   POST /api/requests/:id/counter-offer
 * @desc    Add a counter offer
 * @access  Private (supplier or requester only)
 */
router.post("/:id/counter-offer", addCounterOffer);

export default router;
