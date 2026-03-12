import LogisticsJob from "../models/LogisticsJob.js";
import Transaction from "../models/Transaction.js";
import Material from "../models/Material.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import crypto from "crypto";

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * @desc    Schedule a pickup/logistics job for a transaction
 * @route   POST /api/logistics/schedule
 * @access  Private
 */
export const schedulePickup = async (req, res) => {
  try {
    const {
      transactionId,
      scheduledDate,
      scheduledTimeSlot,
      scheduledTimeStart,
      scheduledTimeEnd,
      jobType = "pickup_and_delivery",
      pickupNotes,
      deliveryNotes,
      vehicleType,
      materialDetails,
    } = req.body;

    // Validate transaction ID
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId)
      .populate("material")
      .populate("supplier", "location address name phone")
      .populate("receiver", "location address name phone");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // Verify user is part of this transaction
    const userId = req.userId.toString();
    if (
      transaction.supplier._id.toString() !== userId &&
      transaction.receiver._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not part of this transaction.",
      });
    }

    // Check if transaction already has a logistics job
    if (transaction.logisticsJob) {
      const existingJob = await LogisticsJob.findById(transaction.logisticsJob);
      if (existingJob && !["cancelled", "failed"].includes(existingJob.status)) {
        return res.status(400).json({
          success: false,
          message: "A logistics job already exists for this transaction.",
          data: { jobId: existingJob._id },
        });
      }
    }

    // Validate scheduled date
    const schedDate = new Date(scheduledDate);
    if (schedDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date must be in the future.",
      });
    }

    // Build pickup and dropoff locations from transaction/material
    const material = transaction.material;
    const supplier = transaction.supplier;
    const receiver = transaction.receiver;

    // Generate OTPs
    const pickupOtp = generateOTP();
    const deliveryOtp = generateOTP();
    const otpExpiry = new Date(schedDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours from scheduled date

    // Create the logistics job
    const logisticsJob = new LogisticsJob({
      transaction: transactionId,
      material: material._id,
      supplier: supplier._id,
      receiver: receiver._id,
      jobType,
      // Pickup location from material
      pickupLocation: material.location,
      pickupAddress: {
        street: material.address?.street,
        landmark: material.address?.landmark,
        city: material.address?.city,
        state: material.address?.state,
        pincode: material.address?.pincode,
        contactName: supplier.name,
        contactPhone: supplier.phone,
      },
      // Dropoff location from receiver
      dropoffLocation: receiver.location || { type: "Point", coordinates: [0, 0] },
      dropoffAddress: {
        street: receiver.address?.street,
        city: receiver.address?.city || "TBD",
        state: receiver.address?.state,
        pincode: receiver.address?.pincode,
        contactName: receiver.name,
        contactPhone: receiver.phone,
      },
      // Scheduling
      scheduledDate: schedDate,
      scheduledTimeSlot: scheduledTimeSlot || "flexible",
      scheduledTimeStart,
      scheduledTimeEnd,
      // Material details
      materialDetails: materialDetails || {
        description: material.title,
        quantity: transaction.quantityExchanged,
        unit: transaction.unit,
        estimatedWeight: material.weight || null,
      },
      // Vehicle type
      vehicleType: vehicleType || "any",
      // OTPs
      pickupOtp: { code: pickupOtp, expiresAt: otpExpiry },
      deliveryOtp: { code: deliveryOtp, expiresAt: otpExpiry },
      // Notes
      pickupNotes,
      deliveryNotes,
      // Status
      status: "pending",
    });

    await logisticsJob.save();

    // Update transaction with logistics job reference
    transaction.logisticsJob = logisticsJob._id;
    transaction.logisticsType = "platform_delivery";
    transaction.scheduledDate = schedDate;
    transaction.scheduledTimeSlot = scheduledTimeSlot || "flexible";
    transaction.status = "scheduled";
    await transaction.save();

    res.status(201).json({
      success: true,
      message: "Pickup scheduled successfully.",
      data: {
        job: logisticsJob,
        // Only show OTPs to relevant parties
        pickupOtp: userId === supplier._id.toString() ? pickupOtp : undefined,
        deliveryOtp: userId === receiver._id.toString() ? deliveryOtp : undefined,
      },
    });
  } catch (error) {
    console.error("Schedule pickup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule pickup.",
    });
  }
};

/**
 * @desc    Get logistics jobs for current user
 * @route   GET /api/logistics
 * @access  Private
 */
export const getLogisticsJobs = async (req, res) => {
  try {
    const {
      role = "all", // "supplier", "receiver", "partner", "all"
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (role === "supplier") {
      query.supplier = req.userId;
    } else if (role === "receiver") {
      query.receiver = req.userId;
    } else if (role === "partner") {
      query.partner = req.userId;
    } else {
      query.$or = [
        { supplier: req.userId },
        { receiver: req.userId },
        { partner: req.userId },
      ];
    }

    // Filter by status
    if (status) {
      const statuses = status.split(",");
      query.status = { $in: statuses };
    }

    const [jobs, total] = await Promise.all([
      LogisticsJob.find(query)
        .populate("material", "title images")
        .populate("supplier", "name avatar phone")
        .populate("receiver", "name avatar phone")
        .populate("partner", "name avatar phone")
        .sort({ scheduledDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      LogisticsJob.countDocuments(query),
    ]);

    // Add user's role to each job
    const userId = req.userId.toString();
    const enrichedJobs = jobs.map((job) => ({
      ...job,
      userRole: 
        job.supplier?._id?.toString() === userId ? "supplier" :
        job.receiver?._id?.toString() === userId ? "receiver" :
        job.partner?._id?.toString() === userId ? "partner" : "unknown",
    }));

    res.status(200).json({
      success: true,
      data: {
        jobs: enrichedJobs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get logistics jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logistics jobs.",
    });
  }
};

/**
 * @desc    Get a single logistics job
 * @route   GET /api/logistics/:id
 * @access  Private
 */
export const getLogisticsJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const job = await LogisticsJob.findById(id)
      .populate("material", "title description images address")
      .populate("transaction", "status agreedPrice quantityExchanged")
      .populate("supplier", "name avatar phone email address")
      .populate("receiver", "name avatar phone email address")
      .populate("partner", "name avatar phone")
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Logistics job not found.",
      });
    }

    // Check access
    const userId = req.userId.toString();
    const isSupplier = job.supplier?._id?.toString() === userId;
    const isReceiver = job.receiver?._id?.toString() === userId;
    const isPartner = job.partner?._id?.toString() === userId;

    if (!isSupplier && !isReceiver && !isPartner) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Determine user role
    const userRole = isSupplier ? "supplier" : isReceiver ? "receiver" : "partner";

    // Only show relevant OTPs
    const jobResponse = { ...job };
    if (isSupplier) {
      jobResponse.pickupOtp = job.pickupOtp?.code;
      delete jobResponse.deliveryOtp;
    } else if (isReceiver) {
      jobResponse.deliveryOtp = job.deliveryOtp?.code;
      delete jobResponse.pickupOtp;
    } else if (isPartner) {
      // Partner doesn't see OTP codes, they verify them
      delete jobResponse.pickupOtp;
      delete jobResponse.deliveryOtp;
    }

    res.status(200).json({
      success: true,
      data: {
        job: jobResponse,
        userRole,
      },
    });
  } catch (error) {
    console.error("Get logistics job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logistics job.",
    });
  }
};

/**
 * @desc    Update logistics job status
 * @route   PATCH /api/logistics/:id
 * @access  Private
 */
export const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, ...data } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const job = await LogisticsJob.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Logistics job not found.",
      });
    }

    const userId = req.userId.toString();
    const isSupplier = job.supplier.toString() === userId;
    const isReceiver = job.receiver.toString() === userId;
    const isPartner = job.partner?.toString() === userId;

    // Define valid status transitions
    const statusTransitions = {
      assign: {
        from: ["pending"],
        to: "assigned",
        roles: ["admin"], // For now, placeholder
      },
      accept: {
        from: ["assigned"],
        to: "accepted",
        roles: ["partner"],
      },
      start_pickup: {
        from: ["accepted"],
        to: "en_route_pickup",
        roles: ["partner"],
      },
      arrive_pickup: {
        from: ["en_route_pickup"],
        to: "arrived_pickup",
        roles: ["partner"],
      },
      pickup: {
        from: ["arrived_pickup"],
        to: "picked_up",
        roles: ["partner"],
      },
      start_transit: {
        from: ["picked_up"],
        to: "in_transit",
        roles: ["partner"],
      },
      arrive_delivery: {
        from: ["in_transit"],
        to: "arrived_delivery",
        roles: ["partner"],
      },
      deliver: {
        from: ["arrived_delivery"],
        to: "delivered",
        roles: ["partner"],
      },
      fail: {
        from: ["en_route_pickup", "arrived_pickup", "picked_up", "in_transit", "arrived_delivery"],
        to: "failed",
        roles: ["partner"],
      },
      cancel: {
        from: ["pending", "assigned", "accepted"],
        to: "cancelled",
        roles: ["supplier", "receiver"],
      },
    };

    if (!action || !statusTransitions[action]) {
      return res.status(400).json({
        success: false,
        message: "Invalid action.",
        validActions: Object.keys(statusTransitions),
      });
    }

    const transition = statusTransitions[action];

    // Check current status allows this transition
    if (!transition.from.includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot ${action} a job with status '${job.status}'.`,
      });
    }

    // Check role permission (simplified for now)
    const userRole = isPartner ? "partner" : isSupplier ? "supplier" : isReceiver ? "receiver" : null;
    if (!transition.roles.includes(userRole) && !transition.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: `Only ${transition.roles.join(" or ")} can perform this action.`,
      });
    }

    // Update job status
    job.status = transition.to;

    // Handle specific actions
    if (action === "pickup") {
      job.actualPickupTime = new Date();
      if (data.notes) job.partnerNotes = data.notes;
    } else if (action === "deliver") {
      job.actualDeliveryTime = new Date();
      if (data.notes) job.partnerNotes = data.notes;
    } else if (action === "fail") {
      job.failureReason = data.reason || "other";
      job.failureNotes = data.notes;
      job.attempts += 1;
    } else if (action === "cancel") {
      job.cancelledBy = req.userId;
      job.cancellationReason = data.reason;
      job.cancelledAt = new Date();
    }

    // Update location tracking if provided
    if (data.currentLocation) {
      job.currentLocation = {
        type: "Point",
        coordinates: data.currentLocation,
        updatedAt: new Date(),
      };
      job.trackingHistory.push({
        location: { type: "Point", coordinates: data.currentLocation },
        timestamp: new Date(),
        status: job.status,
      });
    }

    await job.save();

    // Update transaction status if needed
    if (["delivered", "failed", "cancelled"].includes(job.status)) {
      const transaction = await Transaction.findById(job.transaction);
      if (transaction) {
        if (job.status === "delivered") {
          transaction.status = "handed_over";
        } else if (job.status === "cancelled") {
          transaction.status = "initiated"; // Reset to allow rescheduling
          transaction.logisticsJob = null;
        }
        await transaction.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Job ${action} successful.`,
      data: { job },
    });
  } catch (error) {
    console.error("Update job status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job status.",
    });
  }
};

/**
 * @desc    Verify pickup with OTP
 * @route   POST /api/logistics/:id/verify-pickup
 * @access  Private (partner only)
 */
export const verifyPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    const job = await LogisticsJob.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Logistics job not found.",
      });
    }

    // Check if user is the partner
    const isPartner = job.partner?.toString() === req.userId.toString();
    if (!isPartner) {
      return res.status(403).json({
        success: false,
        message: "Only assigned partner can verify pickup.",
      });
    }

    // Check job status
    if (job.status !== "arrived_pickup") {
      return res.status(400).json({
        success: false,
        message: "Job must be at pickup location to verify.",
      });
    }

    // Verify OTP
    if (job.pickupOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // Check OTP expiry
    if (new Date() > job.pickupOtp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    // Mark pickup verified
    job.proofOfPickup.otp = otp;
    job.proofOfPickup.verifiedAt = new Date();
    job.status = "picked_up";
    job.actualPickupTime = new Date();

    await job.save();

    res.status(200).json({
      success: true,
      message: "Pickup verified successfully.",
      data: { job },
    });
  } catch (error) {
    console.error("Verify pickup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify pickup.",
    });
  }
};

/**
 * @desc    Verify delivery with OTP
 * @route   POST /api/logistics/:id/verify-delivery
 * @access  Private (partner only)
 */
export const verifyDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    const job = await LogisticsJob.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Logistics job not found.",
      });
    }

    // Check if user is the partner
    const isPartner = job.partner?.toString() === req.userId.toString();
    if (!isPartner) {
      return res.status(403).json({
        success: false,
        message: "Only assigned partner can verify delivery.",
      });
    }

    // Check job status
    if (job.status !== "arrived_delivery") {
      return res.status(400).json({
        success: false,
        message: "Job must be at delivery location to verify.",
      });
    }

    // Verify OTP
    if (job.deliveryOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // Check OTP expiry
    if (new Date() > job.deliveryOtp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    // Mark delivery verified
    job.proofOfDelivery.otp = otp;
    job.proofOfDelivery.verifiedAt = new Date();
    job.status = "delivered";
    job.actualDeliveryTime = new Date();

    await job.save();

    // Update transaction
    const transaction = await Transaction.findById(job.transaction);
    if (transaction) {
      transaction.status = "handed_over";
      await transaction.save();
    }

    res.status(200).json({
      success: true,
      message: "Delivery verified successfully.",
      data: { job },
    });
  } catch (error) {
    console.error("Verify delivery error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify delivery.",
    });
  }
};

/**
 * @desc    Update live location (for tracking)
 * @route   POST /api/logistics/:id/location
 * @access  Private (partner only)
 */
export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinates } = req.body; // [longitude, latitude]

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Valid coordinates [longitude, latitude] are required.",
      });
    }

    const job = await LogisticsJob.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Logistics job not found.",
      });
    }

    // Check if user is the partner
    const isPartner = job.partner?.toString() === req.userId.toString();
    if (!isPartner) {
      return res.status(403).json({
        success: false,
        message: "Only assigned partner can update location.",
      });
    }

    // Update current location
    job.currentLocation = {
      type: "Point",
      coordinates,
      updatedAt: new Date(),
    };

    // Add to tracking history
    job.trackingHistory.push({
      location: { type: "Point", coordinates },
      timestamp: new Date(),
      status: job.status,
    });

    await job.save();

    res.status(200).json({
      success: true,
      message: "Location updated.",
      data: {
        currentLocation: job.currentLocation,
      },
    });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location.",
    });
  }
};

/**
 * @desc    Assign a logistics partner to a job
 * @route   POST /api/logistics/:id/assign
 * @access  Private (admin or system)
 */
export const assignPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partner ID.",
      });
    }

    const job = await LogisticsJob.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Logistics job not found.",
      });
    }

    // Verify partner exists and is a logistics partner
    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== "logistics_partner") {
      return res.status(400).json({
        success: false,
        message: "Invalid logistics partner.",
      });
    }

    if (job.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only assign partner to pending jobs.",
      });
    }

    job.partner = partnerId;
    job.status = "assigned";
    await job.save();

    res.status(200).json({
      success: true,
      message: "Partner assigned successfully.",
      data: { job },
    });
  } catch (error) {
    console.error("Assign partner error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign partner.",
    });
  }
};

export default {
  schedulePickup,
  getLogisticsJobs,
  getLogisticsJob,
  updateJobStatus,
  verifyPickup,
  verifyDelivery,
  updateLocation,
  assignPartner,
};
