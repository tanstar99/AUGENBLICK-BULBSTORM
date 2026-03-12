import Transaction from "../models/Transaction.js";
import MaterialRequest from "../models/MaterialRequest.js";
import Material from "../models/Material.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * @desc    Get transactions for current user
 * @route   GET /api/transactions
 * @access  Private
 */
export const getTransactions = async (req, res) => {
  try {
    const {
      role = "all", // "supplier", "receiver", "all"
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query based on role
    const query = {};

    if (role === "supplier") {
      query.supplier = req.userId;
    } else if (role === "receiver") {
      query.receiver = req.userId;
    } else {
      // All - either supplier or receiver
      query.$or = [{ supplier: req.userId }, { receiver: req.userId }];
    }

    // Filter by status
    if (status) {
      const statuses = status.split(",");
      query.status = { $in: statuses };
    }

    // Sort options
    const sortOptions = {};
    const validSortFields = ["createdAt", "scheduledDate", "status", "completedAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("material", "title images address unit")
        .populate("supplier", "name avatar rating phone")
        .populate("receiver", "name avatar rating phone")
        .populate("request", "message purpose")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    // Add computed fields
    const userIdStr = req.userId.toString();
    const enrichedTransactions = transactions.map((txn) => ({
      ...txn,
      userRole: txn.supplier._id.toString() === userIdStr ? "supplier" : "receiver",
      canConfirm: 
        (txn.supplier._id.toString() === userIdStr && !txn.supplierConfirmed) ||
        (txn.receiver._id.toString() === userIdStr && !txn.receiverConfirmed),
    }));

    res.status(200).json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasMore: pageNum * limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions.",
    });
  }
};

/**
 * @desc    Get a single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findById(id)
      .populate("material", "title description images address unit condition")
      .populate("supplier", "name avatar rating phone email address")
      .populate("receiver", "name avatar rating phone email address")
      .populate("request")
      .populate("logisticsJob");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // Only supplier or receiver can view
    const userId = req.userId.toString();
    if (
      transaction.supplier._id.toString() !== userId &&
      transaction.receiver._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Determine user's role
    const userRole = transaction.supplier._id.toString() === userId ? "supplier" : "receiver";

    res.status(200).json({
      success: true,
      data: {
        transaction,
        userRole,
        canConfirm:
          (userRole === "supplier" && !transaction.supplierConfirmed) ||
          (userRole === "receiver" && !transaction.receiverConfirmed),
      },
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction.",
    });
  }
};

/**
 * @desc    Update transaction (schedule, confirm, dispute, cancel)
 * @route   PATCH /api/transactions/:id
 * @access  Private
 */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      action, // "schedule", "confirm", "dispute", "cancel", "add_note", "add_photo"
      scheduledDate,
      scheduledTimeSlot,
      disputeReason,
      disputeDescription,
      cancellationReason,
      notes,
      photo,
      estimatedWeight,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findById(id)
      .populate("material")
      .populate("supplier", "name impactStats")
      .populate("receiver", "name impactStats");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // Authorization
    const userId = req.userId.toString();
    const isSupplier = transaction.supplier._id.toString() === userId;
    const isReceiver = transaction.receiver._id.toString() === userId;

    if (!isSupplier && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Handle different actions
    switch (action) {
      case "schedule":
        return await handleSchedule(req, res, transaction, isSupplier, {
          scheduledDate,
          scheduledTimeSlot,
        });

      case "confirm":
        return await handleConfirm(req, res, transaction, isSupplier, isReceiver, {
          estimatedWeight,
        });

      case "dispute":
        return await handleDispute(req, res, transaction, { disputeReason, disputeDescription });

      case "cancel":
        return await handleCancel(req, res, transaction, isSupplier, { cancellationReason });

      case "add_note":
        return await handleAddNote(req, res, transaction, isSupplier, { notes });

      case "add_photo":
        return await handleAddPhoto(req, res, transaction, { photo });

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action. Allowed: schedule, confirm, dispute, cancel, add_note, add_photo.",
        });
    }
  } catch (error) {
    console.error("Update transaction error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update transaction.",
    });
  }
};

/**
 * Handle scheduling a transaction
 */
async function handleSchedule(req, res, transaction, isSupplier, { scheduledDate, scheduledTimeSlot }) {
  // Only initiated/scheduled transactions can be rescheduled
  if (!["initiated", "scheduled"].includes(transaction.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot schedule transaction with status: ${transaction.status}`,
    });
  }

  if (!scheduledDate) {
    return res.status(400).json({
      success: false,
      message: "Scheduled date is required.",
    });
  }

  const newDate = new Date(scheduledDate);
  if (newDate < new Date()) {
    return res.status(400).json({
      success: false,
      message: "Scheduled date must be in the future.",
    });
  }

  transaction.scheduledDate = newDate;
  transaction.scheduledTimeSlot = scheduledTimeSlot || "flexible";
  transaction.status = "scheduled";

  transaction.timeline.push({
    event: "transaction_scheduled",
    description: `Pickup/delivery scheduled for ${newDate.toDateString()}`,
    timestamp: new Date(),
    by: req.userId,
  });

  await transaction.save();

  return res.status(200).json({
    success: true,
    message: "Transaction scheduled successfully.",
    data: { transaction },
  });
}

/**
 * Handle confirming a transaction (handover/receipt)
 */
async function handleConfirm(req, res, transaction, isSupplier, isReceiver, { estimatedWeight }) {
  // Must be in appropriate status
  if (!["scheduled", "in_progress", "handed_over", "received"].includes(transaction.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot confirm transaction with status: ${transaction.status}`,
    });
  }

  if (isSupplier) {
    if (transaction.supplierConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Supplier has already confirmed.",
      });
    }

    await transaction.confirmBySupplier();

    // If both confirmed, mark request as completed
    if (transaction.status === "completed") {
      await completeTransactionFlow(transaction, estimatedWeight);
    }

    return res.status(200).json({
      success: true,
      message: "Handover confirmed by supplier.",
      data: { transaction },
    });
  }

  if (isReceiver) {
    if (transaction.receiverConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Receiver has already confirmed.",
      });
    }

    await transaction.confirmByReceiver();

    // If both confirmed, complete the flow
    if (transaction.status === "completed") {
      await completeTransactionFlow(transaction, estimatedWeight);
    }

    return res.status(200).json({
      success: true,
      message: "Receipt confirmed by receiver.",
      data: { transaction },
    });
  }
}

/**
 * Complete transaction flow - update related records and calculate impact
 */
async function completeTransactionFlow(transaction, estimatedWeight) {
  // Update the request status
  await MaterialRequest.findByIdAndUpdate(transaction.request, {
    status: "completed",
  });

  // Calculate impact metrics using stored factors
  const weight = estimatedWeight || transaction.impactMetrics.weightDiverted || transaction.quantityExchanged;
  const categoryImpactFactor = transaction.impactMetrics.categoryImpactFactor || 2.5;
  const landfillDiversionFactor = transaction.impactMetrics.landfillDiversionFactor || 1.0;
  const circularActionMultiplier = transaction.impactMetrics.circularActionMultiplier || 1.0;

  transaction.impactMetrics.weightDiverted = weight;
  transaction.impactMetrics.co2Saved = weight * categoryImpactFactor * circularActionMultiplier;
  transaction.impactMetrics.landfillDiverted = weight * landfillDiversionFactor;
  await transaction.save();

  // Update user impact stats
  const co2Saved = weight * categoryImpactFactor * circularActionMultiplier;
  const impactUpdate = {
    $inc: {
      "impactStats.totalTransactions": 1,
      "impactStats.weightDiverted": weight,
      "impactStats.co2Saved": co2Saved,
    },
  };

  await User.findByIdAndUpdate(transaction.supplier._id || transaction.supplier, impactUpdate);
  await User.findByIdAndUpdate(transaction.receiver._id || transaction.receiver, impactUpdate);

  // Update material status
  const material = await Material.findById(transaction.material._id || transaction.material);
  if (material) {
    if (material.availableQuantity <= 0) {
      material.status = "completed";
    }
    material.completedTransactions = (material.completedTransactions || 0) + 1;
    await material.save();
  }
}

/**
 * Handle raising a dispute
 */
async function handleDispute(req, res, transaction, { disputeReason, disputeDescription }) {
  if (!disputeReason) {
    return res.status(400).json({
      success: false,
      message: "Dispute reason is required.",
    });
  }

  // Can't dispute already completed or cancelled
  if (["completed", "cancelled"].includes(transaction.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot dispute transaction with status: ${transaction.status}`,
    });
  }

  await transaction.raiseDispute(req.userId, disputeReason, disputeDescription || "");

  return res.status(200).json({
    success: true,
    message: "Dispute raised successfully. Our team will review it.",
    data: { transaction },
  });
}

/**
 * Handle cancelling a transaction
 */
async function handleCancel(req, res, transaction, isSupplier, { cancellationReason }) {
  // Can only cancel initiated or scheduled transactions
  if (!["initiated", "scheduled"].includes(transaction.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel transaction with status: ${transaction.status}`,
    });
  }

  transaction.status = "cancelled";
  transaction.cancelledBy = req.userId;
  transaction.cancellationReason = cancellationReason || "";
  transaction.cancelledAt = new Date();

  transaction.timeline.push({
    event: "transaction_cancelled",
    description: `Transaction cancelled by ${isSupplier ? "supplier" : "receiver"}`,
    timestamp: new Date(),
    by: req.userId,
  });

  await transaction.save();

  // Restore material quantity
  await Material.findByIdAndUpdate(transaction.material._id || transaction.material, {
    $inc: { availableQuantity: transaction.quantityExchanged },
    $set: { status: "available" },
  });

  // Update request status
  await MaterialRequest.findByIdAndUpdate(transaction.request, {
    status: "cancelled",
    cancelledBy: req.userId,
    cancellationReason: cancellationReason || "Transaction cancelled",
    cancelledAt: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "Transaction cancelled.",
    data: { transaction },
  });
}

/**
 * Handle adding notes
 */
async function handleAddNote(req, res, transaction, isSupplier, { notes }) {
  if (!notes) {
    return res.status(400).json({
      success: false,
      message: "Notes content is required.",
    });
  }

  if (isSupplier) {
    transaction.supplierNotes = notes;
  } else {
    transaction.receiverNotes = notes;
  }

  await transaction.save();

  return res.status(200).json({
    success: true,
    message: "Notes added.",
    data: { transaction },
  });
}

/**
 * Handle adding exchange photo
 */
async function handleAddPhoto(req, res, transaction, { photo }) {
  if (!photo || !photo.url) {
    return res.status(400).json({
      success: false,
      message: "Photo URL is required.",
    });
  }

  transaction.exchangePhotos.push({
    url: photo.url,
    uploadedBy: req.userId,
    uploadedAt: new Date(),
    type: photo.type || "material",
  });

  await transaction.save();

  return res.status(200).json({
    success: true,
    message: "Photo added.",
    data: {
      photo: transaction.exchangePhotos[transaction.exchangePhotos.length - 1],
    },
  });
}

/**
 * @desc    Verify transaction with code (for pickup)
 * @route   POST /api/transactions/:id/verify
 * @access  Private
 */
export const verifyTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // Only receiver can verify
    if (transaction.receiver.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can verify the transaction.",
      });
    }

    // Check code
    if (transaction.verificationCode !== code.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    // Auto-confirm receiver
    if (!transaction.receiverConfirmed) {
      transaction.receiverConfirmed = true;
      transaction.receiverConfirmedAt = new Date();
      transaction.status = "received";

      transaction.timeline.push({
        event: "verified_with_code",
        description: "Transaction verified with code",
        timestamp: new Date(),
        by: req.userId,
      });

      // If supplier also confirmed, complete
      if (transaction.supplierConfirmed) {
        await transaction.completeTransaction();
        await completeTransactionFlow(transaction);
      } else {
        await transaction.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Transaction verified successfully.",
      data: { transaction },
    });
  } catch (error) {
    console.error("Verify transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify transaction.",
    });
  }
};

/**
 * @desc    Get transaction stats for user
 * @route   GET /api/transactions/stats
 * @access  Private
 */
export const getTransactionStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const stats = await Transaction.aggregate([
      {
        $match: {
          $or: [{ supplier: userId }, { receiver: userId }],
        },
      },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalTransactions: { $sum: 1 },
                completedTransactions: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                totalQuantity: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "completed"] }, "$quantityExchanged", 0],
                  },
                },
                totalWeight: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "completed"] }, "$impactMetrics.weightDiverted", 0],
                  },
                },
                totalCo2Saved: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "completed"] }, "$impactMetrics.co2Saved", 0],
                  },
                },
              },
            },
          ],
          asSupplier: [
            { $match: { supplier: userId } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
              },
            },
          ],
          asReceiver: [
            { $match: { receiver: userId } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const result = stats[0];
    const totals = result.totals[0] || {
      totalTransactions: 0,
      completedTransactions: 0,
      totalQuantity: 0,
      totalWeight: 0,
      totalCo2Saved: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        overall: {
          total: totals.totalTransactions,
          completed: totals.completedTransactions,
          completionRate:
            totals.totalTransactions > 0
              ? Math.round((totals.completedTransactions / totals.totalTransactions) * 100)
              : 0,
        },
        byStatus: result.byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        asSupplier: result.asSupplier[0] || { count: 0, completed: 0 },
        asReceiver: result.asReceiver[0] || { count: 0, completed: 0 },
        impact: {
          totalQuantity: totals.totalQuantity,
          weightDiverted: totals.totalWeight,
          co2Saved: totals.totalCo2Saved,
        },
      },
    });
  } catch (error) {
    console.error("Get transaction stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction stats.",
    });
  }
};
