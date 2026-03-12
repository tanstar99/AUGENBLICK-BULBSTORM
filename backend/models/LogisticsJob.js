import mongoose from "mongoose";

const logisticsJobSchema = new mongoose.Schema(
  {
    // Reference to transaction
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction reference is required"],
    },
    // Reference to material
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Material reference is required"],
    },
    // Parties involved
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Assigned logistics partner
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Job type
    jobType: {
      type: String,
      enum: ["pickup_only", "delivery_only", "pickup_and_delivery"],
      default: "pickup_and_delivery",
    },
    // Pickup details
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    pickupAddress: {
      street: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      contactName: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
    },
    // Dropoff details
    dropoffLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    dropoffAddress: {
      street: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      contactName: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
    },
    // Distance and route
    distance: {
      value: { type: Number }, // in meters
      text: { type: String },  // e.g., "5.2 km"
    },
    estimatedDuration: {
      value: { type: Number }, // in seconds
      text: { type: String },  // e.g., "25 mins"
    },
    // Scheduling
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    scheduledTimeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening", "flexible"],
      required: true,
    },
    // Specific time window
    scheduledTimeStart: {
      type: String, // "09:00"
    },
    scheduledTimeEnd: {
      type: String, // "12:00"
    },
    // Actual timestamps
    actualPickupTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    // Job status
    status: {
      type: String,
      enum: [
        "pending",        // Awaiting partner assignment
        "assigned",       // Partner assigned
        "accepted",       // Partner accepted
        "en_route_pickup", // Partner heading to pickup
        "arrived_pickup", // Partner at pickup location
        "picked_up",      // Material picked up
        "in_transit",     // On the way to delivery
        "arrived_delivery", // At delivery location
        "delivered",      // Delivered successfully
        "failed",         // Delivery failed
        "cancelled",      // Job cancelled
      ],
      default: "pending",
    },
    // Cost details
    estimatedCost: {
      type: Number,
      min: 0,
    },
    actualCost: {
      type: Number,
      min: 0,
    },
    costBreakdown: {
      baseFare: { type: Number, default: 0 },
      distanceFare: { type: Number, default: 0 },
      weightCharge: { type: Number, default: 0 },
      handlingCharge: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
    },
    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "paid_by_supplier", "paid_by_receiver", "cod", "free"],
      default: "pending",
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Material details for logistics
    materialDetails: {
      description: { type: String },
      quantity: { type: Number },
      unit: { type: String },
      estimatedWeight: { type: Number }, // kg
      dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
        unit: { type: String, default: "cm" },
      },
      requiresSpecialHandling: { type: Boolean, default: false },
      handlingInstructions: { type: String },
    },
    // Vehicle requirements
    vehicleType: {
      type: String,
      enum: ["bike", "auto", "van", "mini_truck", "truck", "any"],
      default: "any",
    },
    // Proof of pickup/delivery
    proofOfPickup: {
      photo: { type: String },
      signature: { type: String },
      otp: { type: String },
      verifiedAt: { type: Date },
    },
    proofOfDelivery: {
      photo: { type: String },
      signature: { type: String },
      otp: { type: String },
      verifiedAt: { type: Date },
    },
    // OTP codes
    pickupOtp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    deliveryOtp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    // Notes
    pickupNotes: { type: String, trim: true },
    deliveryNotes: { type: String, trim: true },
    partnerNotes: { type: String, trim: true },
    // Failure details
    failureReason: {
      type: String,
      enum: [
        "customer_unavailable",
        "wrong_address",
        "refused_delivery",
        "material_damaged",
        "vehicle_issue",
        "weather",
        "other",
      ],
    },
    failureNotes: { type: String, trim: true },
    // Attempt tracking
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    // Rating by parties
    ratingBySupplier: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      ratedAt: { type: Date },
    },
    ratingByReceiver: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      ratedAt: { type: Date },
    },
    // Live tracking
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
      updatedAt: { type: Date },
    },
    trackingHistory: [
      {
        location: {
          type: {
            type: String,
            enum: ["Point"],
          },
          coordinates: [Number],
        },
        timestamp: { type: Date, default: Date.now },
        status: { type: String },
      },
    ],
    // Cancellation
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: { type: String, trim: true },
    cancelledAt: { type: Date },
    // Priority
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
logisticsJobSchema.index({ transaction: 1 });
logisticsJobSchema.index({ partner: 1, status: 1 });
logisticsJobSchema.index({ status: 1, scheduledDate: 1 });
logisticsJobSchema.index({ pickupLocation: "2dsphere" });
logisticsJobSchema.index({ dropoffLocation: "2dsphere" });
logisticsJobSchema.index({ currentLocation: "2dsphere" }, { sparse: true });
logisticsJobSchema.index({ supplier: 1 });
logisticsJobSchema.index({ receiver: 1 });
logisticsJobSchema.index({ scheduledDate: 1, scheduledTimeSlot: 1 });
logisticsJobSchema.index({ priority: 1, status: 1 });

// Pre-save: Generate OTPs
logisticsJobSchema.pre("save", function (next) {
  if (this.isNew) {
    // Generate 4-digit OTPs
    this.pickupOtp = {
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    this.deliveryOtp = {
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    };
  }
  next();
});

// Virtual: Distance in km
logisticsJobSchema.virtual("distanceKm").get(function () {
  return this.distance?.value ? (this.distance.value / 1000).toFixed(2) : null;
});

// Virtual: Is job active
logisticsJobSchema.virtual("isActive").get(function () {
  const activeStatuses = [
    "assigned",
    "accepted",
    "en_route_pickup",
    "arrived_pickup",
    "picked_up",
    "in_transit",
    "arrived_delivery",
  ];
  return activeStatuses.includes(this.status);
});

// Instance method: Accept job (by partner)
logisticsJobSchema.methods.acceptJob = async function (partnerId) {
  if (this.status !== "assigned") {
    throw new Error("Job cannot be accepted in current status");
  }
  this.partner = partnerId;
  this.status = "accepted";
  return this.save();
};

// Instance method: Update status
logisticsJobSchema.methods.updateJobStatus = async function (newStatus, notes = "") {
  const validTransitions = {
    pending: ["assigned", "cancelled"],
    assigned: ["accepted", "cancelled"],
    accepted: ["en_route_pickup", "cancelled"],
    en_route_pickup: ["arrived_pickup", "cancelled"],
    arrived_pickup: ["picked_up", "failed"],
    picked_up: ["in_transit"],
    in_transit: ["arrived_delivery"],
    arrived_delivery: ["delivered", "failed"],
  };

  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  if (notes) this.partnerNotes = notes;

  // Update timestamps
  if (newStatus === "picked_up") this.actualPickupTime = new Date();
  if (newStatus === "delivered") this.actualDeliveryTime = new Date();

  return this.save();
};

// Instance method: Verify pickup OTP
logisticsJobSchema.methods.verifyPickupOtp = function (otp) {
  if (
    this.pickupOtp?.code === otp &&
    this.pickupOtp?.expiresAt > new Date()
  ) {
    this.proofOfPickup.verifiedAt = new Date();
    return true;
  }
  return false;
};

// Instance method: Verify delivery OTP
logisticsJobSchema.methods.verifyDeliveryOtp = function (otp) {
  if (
    this.deliveryOtp?.code === otp &&
    this.deliveryOtp?.expiresAt > new Date()
  ) {
    this.proofOfDelivery.verifiedAt = new Date();
    return true;
  }
  return false;
};

// Instance method: Update live location
logisticsJobSchema.methods.updateLocation = async function (coordinates) {
  this.currentLocation = {
    type: "Point",
    coordinates,
    updatedAt: new Date(),
  };
  this.trackingHistory.push({
    location: { type: "Point", coordinates },
    timestamp: new Date(),
    status: this.status,
  });
  return this.save();
};

// Static method: Find nearby pending jobs for partners
logisticsJobSchema.statics.findNearbyJobs = function (coordinates, maxDistanceKm = 15) {
  return this.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates },
        distanceField: "distanceFromPartner",
        maxDistance: maxDistanceKm * 1000,
        spherical: true,
        query: { status: "pending" },
      },
    },
    {
      $lookup: {
        from: "materials",
        localField: "material",
        foreignField: "_id",
        as: "materialDetails",
      },
    },
    { $unwind: "$materialDetails" },
    { $sort: { priority: -1, scheduledDate: 1 } },
  ]);
};

// Static method: Get partner's job statistics
logisticsJobSchema.statics.getPartnerStats = async function (partnerId) {
  return this.aggregate([
    { $match: { partner: new mongoose.Types.ObjectId(partnerId) } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completedJobs: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        failedJobs: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        totalEarnings: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$actualCost", 0] },
        },
        avgRating: { $avg: "$ratingByReceiver.rating" },
      },
    },
  ]);
};

const LogisticsJob = mongoose.model("LogisticsJob", logisticsJobSchema);

export default LogisticsJob;
