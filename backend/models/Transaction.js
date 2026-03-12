import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // Reference to the original request
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialRequest",
      required: [true, "Request reference is required"],
    },
    // Material being exchanged
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Material reference is required"],
    },
    // Parties involved
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supplier reference is required"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver reference is required"],
    },
    // Quantity being exchanged
    quantityExchanged: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 1,
    },
    unit: {
      type: String,
      enum: ["pieces", "kg", "tons", "cubic_meters", "square_meters", "liters", "units"],
      default: "pieces",
    },
    // Final agreed price
    agreedPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    // Transaction status
    status: {
      type: String,
      enum: [
        "initiated",       // Transaction created after request approval
        "scheduled",       // Pickup/delivery scheduled
        "in_progress",     // Logistics in progress
        "handed_over",     // Supplier handed over material
        "received",        // Receiver confirmed receipt
        "completed",       // Both parties confirmed, impact calculated
        "disputed",        // Issue raised
        "cancelled",       // Transaction cancelled
      ],
      default: "initiated",
    },
    // Confirmation tracking
    supplierConfirmed: {
      type: Boolean,
      default: false,
    },
    supplierConfirmedAt: {
      type: Date,
    },
    receiverConfirmed: {
      type: Boolean,
      default: false,
    },
    receiverConfirmedAt: {
      type: Date,
    },
    // Logistics reference
    logisticsJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LogisticsJob",
    },
    logisticsType: {
      type: String,
      enum: ["self_pickup", "platform_delivery", "third_party"],
      default: "self_pickup",
    },
    // Scheduled handover details
    scheduledDate: {
      type: Date,
    },
    scheduledTimeSlot: {
      type: String,
    },
    // Pickup location
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    pickupAddress: {
      street: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    // Delivery location (if applicable)
    deliveryLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    deliveryAddress: {
      street: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    // Actual completion timestamp
    completedAt: {
      type: Date,
    },
    // Impact metrics (calculated on completion)
    impactMetrics: {
      weightDiverted: { type: Number, default: 0 }, // kg
      co2Saved: { type: Number, default: 0 },       // kg CO2
      landfillDiverted: { type: Number, default: 0 }, // kg
      categoryImpactFactor: { type: Number, default: 2.5 },
      landfillDiversionFactor: { type: Number, default: 1.0 },
      circularActionMultiplier: { type: Number, default: 1.0 },
      circularActionType: { type: String },
    },
    // Dispute details
    dispute: {
      raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: { type: String, trim: true },
      description: { type: String, trim: true },
      raisedAt: { type: Date },
      status: {
        type: String,
        enum: ["open", "under_review", "resolved", "escalated"],
      },
      resolution: { type: String, trim: true },
      resolvedAt: { type: Date },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
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
    // Reviews
    supplierReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
    receiverReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
    // Transaction code for verification
    verificationCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Photos of the exchange
    exchangePhotos: [
      {
        url: { type: String },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: { type: Date, default: Date.now },
        type: { type: String, enum: ["pickup", "delivery", "material"] },
      },
    ],
    // Notes
    supplierNotes: { type: String, trim: true },
    receiverNotes: { type: String, trim: true },
    internalNotes: { type: String, trim: true }, // Admin notes
    // Timeline events
    timeline: [
      {
        event: { type: String, required: true },
        description: { type: String },
        timestamp: { type: Date, default: Date.now },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
transactionSchema.index({ request: 1 });
transactionSchema.index({ material: 1 });
transactionSchema.index({ supplier: 1, status: 1 });
transactionSchema.index({ receiver: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ completedAt: -1 });
transactionSchema.index({ pickupLocation: "2dsphere" }, { sparse: true });
transactionSchema.index({ deliveryLocation: "2dsphere" }, { sparse: true });

// Pre-save: Generate verification code
transactionSchema.pre("save", function () {
  if (this.isNew && !this.verificationCode) {
    // Generate 8-character alphanumeric code
    this.verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
});

// Pre-save: Add timeline event on status change
transactionSchema.pre("save", function () {
  if (this.isModified("status") && !this.isNew) {
    this.timeline.push({
      event: `status_changed_to_${this.status}`,
      description: `Transaction status changed to ${this.status}`,
      timestamp: new Date(),
    });
  }
});

// Virtual: Check if transaction can be completed
transactionSchema.virtual("canComplete").get(function () {
  return this.supplierConfirmed && this.receiverConfirmed;
});

// Virtual: Duration (from creation to completion)
transactionSchema.virtual("durationHours").get(function () {
  if (!this.completedAt) return null;
  const diff = this.completedAt - this.createdAt;
  return Math.round(diff / (1000 * 60 * 60));
});

// Instance method: Confirm by supplier
transactionSchema.methods.confirmBySupplier = async function () {
  this.supplierConfirmed = true;
  this.supplierConfirmedAt = new Date();
  this.status = "handed_over";

  this.timeline.push({
    event: "supplier_confirmed",
    description: "Supplier confirmed material handover",
    timestamp: new Date(),
    by: this.supplier,
  });

  // Check if both confirmed
  if (this.receiverConfirmed) {
    await this.completeTransaction();
  }

  return this.save();
};

// Instance method: Confirm by receiver
transactionSchema.methods.confirmByReceiver = async function () {
  this.receiverConfirmed = true;
  this.receiverConfirmedAt = new Date();
  this.status = "received";

  this.timeline.push({
    event: "receiver_confirmed",
    description: "Receiver confirmed material receipt",
    timestamp: new Date(),
    by: this.receiver,
  });

  // Check if both confirmed
  if (this.supplierConfirmed) {
    await this.completeTransaction();
  }

  return this.save();
};

// Instance method: Complete transaction and calculate impact
transactionSchema.methods.completeTransaction = async function () {
  this.status = "completed";
  this.completedAt = new Date();

  // Preliminary impact calc using stored factors (overwritten by completeTransactionFlow in controller)
  const baseWeight = this.impactMetrics.weightDiverted || this.quantityExchanged;
  const categoryFactor = this.impactMetrics.categoryImpactFactor || 2.5;
  const circularMultiplier = this.impactMetrics.circularActionMultiplier || 1.0;
  const landfillFactor = this.impactMetrics.landfillDiversionFactor || 1.0;
  this.impactMetrics.co2Saved = baseWeight * categoryFactor * circularMultiplier;
  this.impactMetrics.landfillDiverted = baseWeight * landfillFactor;

  this.timeline.push({
    event: "transaction_completed",
    description: "Transaction completed successfully",
    timestamp: new Date(),
  });

  return this.save();
};

// Instance method: Raise dispute
transactionSchema.methods.raiseDispute = async function (userId, reason, description) {
  this.status = "disputed";
  this.dispute = {
    raisedBy: userId,
    reason,
    description,
    raisedAt: new Date(),
    status: "open",
  };

  this.timeline.push({
    event: "dispute_raised",
    description: `Dispute raised: ${reason}`,
    timestamp: new Date(),
    by: userId,
  });

  return this.save();
};

// Instance method: Cancel transaction
transactionSchema.methods.cancelTransaction = async function (userId, reason) {
  this.status = "cancelled";
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  this.cancelledAt = new Date();

  this.timeline.push({
    event: "transaction_cancelled",
    description: `Cancelled: ${reason}`,
    timestamp: new Date(),
    by: userId,
  });

  return this.save();
};

// Static method: Get user's transaction statistics
transactionSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [{ supplier: userId }, { receiver: userId }],
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalWeightDiverted: { $sum: "$impactMetrics.weightDiverted" },
        totalCo2Saved: { $sum: "$impactMetrics.co2Saved" },
        asSupplier: {
          $sum: { $cond: [{ $eq: ["$supplier", userId] }, 1, 0] },
        },
        asReceiver: {
          $sum: { $cond: [{ $eq: ["$receiver", userId] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || {
    totalTransactions: 0,
    totalWeightDiverted: 0,
    totalCo2Saved: 0,
    asSupplier: 0,
    asReceiver: 0,
  };
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
