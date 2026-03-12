import express from "express";
import {
  schedulePickup,
  getLogisticsJobs,
  getLogisticsJob,
  updateJobStatus,
  verifyPickup,
  verifyDelivery,
  updateLocation,
  assignPartner,
} from "../controllers/logisticsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/logistics/schedule
 * @desc    Schedule a pickup/logistics job for a transaction
 * @body    transactionId, scheduledDate, scheduledTimeSlot, jobType, pickupNotes, deliveryNotes, vehicleType, materialDetails
 * @access  Private
 */
router.post("/schedule", schedulePickup);

/**
 * @route   GET /api/logistics
 * @desc    Get logistics jobs for current user
 * @query   role (supplier|receiver|partner|all), status, page, limit
 * @access  Private
 */
router.get("/", getLogisticsJobs);

/**
 * @route   GET /api/logistics/:id
 * @desc    Get a single logistics job
 * @access  Private (supplier, receiver, or partner)
 */
router.get("/:id", getLogisticsJob);

/**
 * @route   PATCH /api/logistics/:id
 * @desc    Update logistics job status
 * @body    action (assign|accept|start_pickup|arrive_pickup|pickup|start_transit|arrive_delivery|deliver|fail|cancel)
 * @access  Private
 */
router.patch("/:id", updateJobStatus);

/**
 * @route   POST /api/logistics/:id/verify-pickup
 * @desc    Verify pickup with OTP
 * @body    otp (required)
 * @access  Private (partner only)
 */
router.post("/:id/verify-pickup", verifyPickup);

/**
 * @route   POST /api/logistics/:id/verify-delivery
 * @desc    Verify delivery with OTP
 * @body    otp (required)
 * @access  Private (partner only)
 */
router.post("/:id/verify-delivery", verifyDelivery);

/**
 * @route   POST /api/logistics/:id/location
 * @desc    Update live location for tracking
 * @body    coordinates [longitude, latitude]
 * @access  Private (partner only)
 */
router.post("/:id/location", updateLocation);

/**
 * @route   POST /api/logistics/:id/assign
 * @desc    Assign a logistics partner to a job
 * @body    partnerId (required)
 * @access  Private (admin)
 */
router.post("/:id/assign", assignPartner);

export default router;
