import mongoose from "mongoose";

const materialRequestSchema = new mongoose.Schema(
  {
    // Material being requested
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Material reference is required"],
    },
    // User requesting the material (seeker)
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester reference is required"],
    },
    // Material owner (supplier)
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supplier reference is required"],
    },
    // Quantity requested
    quantityRequested: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    // Request message
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    // Purpose of the material
    purpose: {
      type: String,
      trim: true,
      maxlength: [500, "Purpose cannot exceed 500 characters"],
    },
    // Request status
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "expired",
        "completed",
      ],
      default: "pending",
    },
    // Logistics preference
    logisticsPreference: {
      type: String,
      enum: ["self_pickup", "delivery", "flexible"],
      default: "flexible",
    },
    // Proposed dates
    proposedPickupDate: {
      type: Date,
    },
    proposedPickupTimeSlot: {
      type: String,
      enum: [
        "morning",    // 9am - 12pm
        "afternoon",  // 12pm - 4pm
        "evening",    // 4pm - 8pm
        "flexible",
      ],
      default: "flexible",
    },
    // Delivery address (if delivery is requested)
    deliveryAddress: {
      street: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
        },
      },
    },
    // Supplier's response
    responseMessage: {
      type: String,
      trim: true,
      maxlength: [1000, "Response cannot exceed 1000 characters"],
    },
    respondedAt: {
      type: Date,
    },
    // Offered price (if negotiating)
    offeredPrice: {
      type: Number,
      min: 0,
    },
    agreedPrice: {
      type: Number,
      min: 0,
    },
    // Counter offers
    counterOffers: [
      {
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        amount: { type: Number },
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Finalized pickup/delivery details
    finalizedDate: {
      type: Date,
    },
    finalizedTimeSlot: {
      type: String,
    },
    // Reference to transaction (created when approved)
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    // Cancellation details
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    // Expiry
    expiresAt: {
      type: Date,
      default: function () {
        // Requests expire after 7 days if not responded
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      },
    },
    // Communication thread
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
      },
    ],
    // Metadata
    source: {
      type: String,
      enum: ["web", "mobile", "api"],
      default: "web",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
materialRequestSchema.index({ material: 1 });
materialRequestSchema.index({ requester: 1, status: 1 });
materialRequestSchema.index({ supplier: 1, status: 1 });
materialRequestSchema.index({ status: 1, expiresAt: 1 });
materialRequestSchema.index({ transaction: 1 });
materialRequestSchema.index({ createdAt: -1 });

// Compound indexes
materialRequestSchema.index({ supplier: 1, status: 1, createdAt: -1 });
materialRequestSchema.index({ requester: 1, status: 1, createdAt: -1 });

// Index for delivery location queries
materialRequestSchema.index({ "deliveryAddress.location": "2dsphere" }, { sparse: true });

// Pre-save validation
materialRequestSchema.pre("save", async function () {
  // Prevent requesting own material
  if (this.isNew && this.requester.toString() === this.supplier.toString()) {
    const error = new Error("Cannot request your own material");
    error.statusCode = 400;
    throw error;
  }
});

// Update respondedAt when status changes
materialRequestSchema.pre("save", function () {
  if (this.isModified("status") && ["approved", "rejected"].includes(this.status)) {
    this.respondedAt = new Date();
  }
});

// Virtual for unread message count
materialRequestSchema.virtual("unreadMessageCount").get(function () {
  return this.messages?.filter((m) => !m.isRead).length || 0;
});

// Virtual for time since created
materialRequestSchema.virtual("timeSinceCreated").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return "Just now";
});

// Instance method: Approve request
materialRequestSchema.methods.approve = async function (responseMessage = "") {
  this.status = "approved";
  this.responseMessage = responseMessage;
  this.respondedAt = new Date();
  return this.save();
};

// Instance method: Reject request
materialRequestSchema.methods.reject = async function (responseMessage = "") {
  this.status = "rejected";
  this.responseMessage = responseMessage;
  this.respondedAt = new Date();
  return this.save();
};

// Instance method: Cancel request
materialRequestSchema.methods.cancel = async function (userId, reason = "") {
  this.status = "cancelled";
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

// Instance method: Add message to thread
materialRequestSchema.methods.addMessage = async function (senderId, content) {
  this.messages.push({
    sender: senderId,
    content,
    createdAt: new Date(),
    isRead: false,
  });
  return this.save();
};

// Static method: Get pending requests for supplier
materialRequestSchema.statics.getPendingForSupplier = function (supplierId) {
  return this.find({
    supplier: supplierId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .populate("material", "title images primaryImage")
    .populate("requester", "name avatar rating")
    .sort({ createdAt: -1 });
};

// Static method: Expire old requests
materialRequestSchema.statics.expireOldRequests = async function () {
  const result = await this.updateMany(
    {
      status: "pending",
      expiresAt: { $lte: new Date() },
    },
    {
      $set: { status: "expired" },
    }
  );
  return result.modifiedCount;
};

const MaterialRequest = mongoose.model("MaterialRequest", materialRequestSchema);

export default MaterialRequest;
