import MaterialRequest from "../models/MaterialRequest.js";
import Material from "../models/Material.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new material request
 * @route   POST /api/requests
 * @access  Private
 */
export const createRequest = async (req, res) => {
  try {
    const {
      materialId,
      quantityRequested,
      message,
      purpose,
      logisticsPreference,
      proposedPickupDate,
      proposedPickupTimeSlot,
      deliveryAddress,
      offeredPrice,
    } = req.body;

    // Validate required fields
    if (!materialId || !quantityRequested) {
      return res.status(400).json({
        success: false,
        message: "Please provide materialId and quantityRequested.",
      });
    }

    // Validate materialId
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID.",
      });
    }

    // Get the material
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found.",
      });
    }

    // Check material availability
    if (material.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Material is not available for requests.",
      });
    }

    // Prevent requesting own material
    if (material.listedBy.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot request your own material.",
      });
    }

    // Validate quantity
    if (quantityRequested > material.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${material.availableQuantity} ${material.unit} available.`,
      });
    }

    // Check for existing pending request
    const existingRequest = await MaterialRequest.findOne({
      material: materialId,
      requester: req.userId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have an active request for this material.",
      });
    }

    // Create the request
    const request = await MaterialRequest.create({
      material: materialId,
      requester: req.userId,
      supplier: material.listedBy,
      quantityRequested,
      message: message || "",
      purpose: purpose || "",
      logisticsPreference: logisticsPreference || "flexible",
      proposedPickupDate: proposedPickupDate ? new Date(proposedPickupDate) : undefined,
      proposedPickupTimeSlot: proposedPickupTimeSlot || "flexible",
      deliveryAddress: deliveryAddress || {},
      offeredPrice: offeredPrice || 0,
      source: req.body.source || "web",
    });

    // Increment request count on material
    await Material.findByIdAndUpdate(materialId, {
      $inc: { requestCount: 1 },
    });

    // Populate for response
    await request.populate([
      { path: "material", select: "title images address price priceType" },
      { path: "requester", select: "name avatar rating" },
      { path: "supplier", select: "name avatar" },
    ]);

    res.status(201).json({
      success: true,
      message: "Request submitted successfully.",
      data: {
        request,
      },
    });
  } catch (error) {
    console.error("Create request error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create request.",
    });
  }
};

/**
 * @desc    Get requests (filtered by role - my requests or requests for my materials)
 * @route   GET /api/requests
 * @access  Private
 */
export const getRequests = async (req, res) => {
  try {
    const {
      type = "all", // "sent", "received", "all"
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query based on type
    const query = {};

    if (type === "sent") {
      query.requester = req.userId;
    } else if (type === "received") {
      query.supplier = req.userId;
    } else {
      // All - either sent or received
      query.$or = [{ requester: req.userId }, { supplier: req.userId }];
    }

    // Filter by status
    if (status) {
      const statuses = status.split(",");
      query.status = { $in: statuses };
    }

    // Sort options
    const sortOptions = {};
    const validSortFields = ["createdAt", "quantityRequested", "status"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [requests, total] = await Promise.all([
      MaterialRequest.find(query)
        .populate("material", "title images address price priceType unit availableQuantity")
        .populate("requester", "name avatar rating phone")
        .populate("supplier", "name avatar rating phone")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MaterialRequest.countDocuments(query),
    ]);

    // Add computed fields
    const enrichedRequests = requests.map((req) => ({
      ...req,
      isExpired: new Date(req.expiresAt) < new Date(),
      canRespond: req.supplier._id.toString() === req.userId?.toString() && req.status === "pending",
    }));

    res.status(200).json({
      success: true,
      data: {
        requests: enrichedRequests,
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
    console.error("Get requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests.",
    });
  }
};

/**
 * @desc    Get a single request by ID
 * @route   GET /api/requests/:id
 * @access  Private
 */
export const getRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
    }

    const request = await MaterialRequest.findById(id)
      .populate("material", "title description images address price priceType unit quantity availableQuantity condition")
      .populate("requester", "name avatar rating phone email address")
      .populate("supplier", "name avatar rating phone email address")
      .populate("transaction");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    // Only supplier or requester can view
    const userId = req.userId.toString();
    if (
      request.requester._id.toString() !== userId &&
      request.supplier._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        request,
      },
    });
  } catch (error) {
    console.error("Get request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch request.",
    });
  }
};

/**
 * @desc    Update request status (approve, reject, cancel)
 * @route   PATCH /api/requests/:id/status
 * @access  Private
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status, // "approved", "rejected", "cancelled"
      responseMessage,
      cancellationReason,
      agreedPrice,
      finalizedDate,
      finalizedTimeSlot,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
    }

    const request = await MaterialRequest.findById(id)
      .populate("material")
      .populate("requester", "name")
      .populate("supplier", "name");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    // Validate status
    const allowedStatuses = ["approved", "rejected", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: approved, rejected, cancelled.",
      });
    }

    // Authorization checks
    const userId = req.userId.toString();
    const isSupplier = request.supplier._id.toString() === userId;
    const isRequester = request.requester._id.toString() === userId;

    // Only supplier can approve/reject
    if ((status === "approved" || status === "rejected") && !isSupplier) {
      return res.status(403).json({
        success: false,
        message: "Only the material owner can approve or reject requests.",
      });
    }

    // Both can cancel (with different semantics)
    if (status === "cancelled" && !isSupplier && !isRequester) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Cannot update non-pending requests (except cancellation of approved)
    if (request.status !== "pending" && !(status === "cancelled" && request.status === "approved")) {
      return res.status(400).json({
        success: false,
        message: `Cannot update request with status: ${request.status}`,
      });
    }

    // Handle different statuses
    if (status === "approved") {
      // Check material availability
      if (request.quantityRequested > request.material.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient quantity available.",
        });
      }

      // Approve the request
      request.status = "approved";
      request.responseMessage = responseMessage || "";
      request.respondedAt = new Date();
      request.agreedPrice = agreedPrice !== undefined ? agreedPrice : request.offeredPrice;
      request.finalizedDate = finalizedDate ? new Date(finalizedDate) : request.proposedPickupDate;
      request.finalizedTimeSlot = finalizedTimeSlot || request.proposedPickupTimeSlot;

      // Create a transaction
      const transaction = await Transaction.create({
        request: request._id,
        material: request.material._id,
        supplier: request.supplier._id,
        receiver: request.requester._id,
        quantityExchanged: request.quantityRequested,
        unit: request.material.unit,
        agreedPrice: request.agreedPrice,
        status: "initiated",
        logisticsType: request.logisticsPreference === "self_pickup" ? "self_pickup" : "platform_delivery",
        scheduledDate: request.finalizedDate,
        scheduledTimeSlot: request.finalizedTimeSlot,
        pickupAddress: request.material.address,
        deliveryAddress: request.deliveryAddress,
        timeline: [
          {
            event: "transaction_created",
            description: "Transaction initiated after request approval",
            timestamp: new Date(),
          },
        ],
      });

      request.transaction = transaction._id;

      // Update material availability
      await Material.findByIdAndUpdate(request.material._id, {
        $inc: { availableQuantity: -request.quantityRequested },
        $set: {
          status:
            request.material.availableQuantity - request.quantityRequested <= 0
              ? "reserved"
              : "available",
        },
      });

      await request.save();

      await transaction.populate([
        { path: "material", select: "title images" },
        { path: "supplier", select: "name avatar" },
        { path: "receiver", select: "name avatar" },
      ]);

      return res.status(200).json({
        success: true,
        message: "Request approved. Transaction created.",
        data: {
          request,
          transaction,
        },
      });
    }

    if (status === "rejected") {
      request.status = "rejected";
      request.responseMessage = responseMessage || "";
      request.respondedAt = new Date();
      await request.save();

      return res.status(200).json({
        success: true,
        message: "Request rejected.",
        data: {
          request,
        },
      });
    }

    if (status === "cancelled") {
      // If approved, need to restore material quantity
      if (request.status === "approved" && request.transaction) {
        const transaction = await Transaction.findById(request.transaction);
        if (transaction && transaction.status === "initiated") {
          // Restore quantity
          await Material.findByIdAndUpdate(request.material._id, {
            $inc: { availableQuantity: request.quantityRequested },
            $set: { status: "available" },
          });

          // Cancel the transaction
          transaction.status = "cancelled";
          transaction.cancelledBy = req.userId;
          transaction.cancellationReason = cancellationReason || "Request cancelled";
          transaction.cancelledAt = new Date();
          transaction.timeline.push({
            event: "transaction_cancelled",
            description: `Cancelled by ${isSupplier ? "supplier" : "requester"}`,
            timestamp: new Date(),
            by: req.userId,
          });
          await transaction.save();
        }
      }

      request.status = "cancelled";
      request.cancelledBy = req.userId;
      request.cancellationReason = cancellationReason || "";
      request.cancelledAt = new Date();
      await request.save();

      return res.status(200).json({
        success: true,
        message: "Request cancelled.",
        data: {
          request,
        },
      });
    }
  } catch (error) {
    console.error("Update request status error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update request status.",
    });
  }
};

/**
 * @desc    Add a message to request thread
 * @route   POST /api/requests/:id/messages
 * @access  Private
 */
export const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required.",
      });
    }

    const request = await MaterialRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    // Only supplier or requester can message
    if (
      request.requester.toString() !== req.userId &&
      request.supplier.toString() !== req.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Add message
    await request.addMessage(req.userId, content.trim());

    res.status(201).json({
      success: true,
      message: "Message sent.",
      data: {
        message: request.messages[request.messages.length - 1],
      },
    });
  } catch (error) {
    console.error("Add message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
};

/**
 * @desc    Add counter offer
 * @route   POST /api/requests/:id/counter-offer
 * @access  Private
 */
export const addCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, message } = req.body;

    if (amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid amount.",
      });
    }

    const request = await MaterialRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    // Only supplier or requester can counter offer
    if (
      request.requester.toString() !== req.userId &&
      request.supplier.toString() !== req.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Can only counter pending requests
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only add counter offers to pending requests.",
      });
    }

    // Add counter offer
    request.counterOffers.push({
      by: req.userId,
      amount,
      message: message || "",
      createdAt: new Date(),
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: "Counter offer added.",
      data: {
        counterOffer: request.counterOffers[request.counterOffers.length - 1],
      },
    });
  } catch (error) {
    console.error("Add counter offer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add counter offer.",
    });
  }
};
