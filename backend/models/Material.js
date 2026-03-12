import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    // Category reference
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    // Material condition
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "salvage"],
      required: [true, "Condition is required"],
      default: "good",
    },
    // Quantity
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["pieces", "kg", "tons", "cubic_meters", "square_meters", "liters", "units"],
      default: "pieces",
    },
    // Images
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public ID
        isPrimary: { type: Boolean, default: false },
      },
    ],
    // GeoJSON location - CRITICAL for geospatial queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Location coordinates are required"],
      },
    },
    // Human-readable address
    address: {
      street: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, default: "India" },
    },
    // Owner
    listedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    // Pricing
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    priceType: {
      type: String,
      enum: ["free", "negotiable", "fixed"],
      default: "free",
    },
    currency: {
      type: String,
      default: "INR",
    },
    // Status
    status: {
      type: String,
      enum: ["draft", "available", "reserved", "partially_reserved", "completed", "expired", "removed"],
      default: "available",
    },
    // Availability window
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableUntil: {
      type: Date,
    },
    // Weight for impact calculation
    estimatedWeight: {
      type: Number, // in kg
      min: 0,
    },
    // Dimensions (optional)
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ["cm", "m", "inch", "ft"], default: "cm" },
    },
    // Tags for searchability
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Logistics preferences
    logisticsOptions: {
      selfPickup: { type: Boolean, default: true },
      deliveryAvailable: { type: Boolean, default: false },
      deliveryRadius: { type: Number, default: 0 }, // in km
      deliveryCost: { type: Number, default: 0 },
    },
    // Statistics
    views: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
    // Moderation
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve, change to false for manual moderation
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
    },
    // AI-generated suggestions
    aiSuggestions: {
      reuseIdeas: [{ type: String }],
      potentialBuyers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      suggestedPrice: { type: Number },
      suggestedCategory: { type: String },
    },
    // Metadata
    source: {
      type: String,
      enum: ["web", "mobile", "api", "import"],
      default: "web",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// CRITICAL: 2dsphere index for geospatial queries
materialSchema.index({ location: "2dsphere" });

// Other indexes
materialSchema.index({ status: 1, isApproved: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ listedBy: 1 });
materialSchema.index({ "address.city": 1 });
materialSchema.index({ priceType: 1 });
materialSchema.index({ condition: 1 });
materialSchema.index({ createdAt: -1 });
materialSchema.index({ availableUntil: 1 }, { expireAfterSeconds: 0 }); // TTL index (optional)

// Compound indexes for common queries
materialSchema.index({ status: 1, category: 1, "address.city": 1 });
materialSchema.index({ status: 1, location: "2dsphere", category: 1 });

// Text index for search
materialSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

// Pre-save middleware
materialSchema.pre("save", function () {
  // Set availableQuantity to quantity on creation
  if (this.isNew && this.availableQuantity === undefined) {
    this.availableQuantity = this.quantity;
  }

  // Auto-generate tags from title if not provided
  if (this.isModified("title") && (!this.tags || this.tags.length === 0)) {
    this.tags = this.title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }
});

// Virtual for primary image
materialSchema.virtual("primaryImage").get(function () {
  const primary = this.images?.find((img) => img.isPrimary);
  return primary?.url || this.images?.[0]?.url || null;
});

// Virtual for availability status
materialSchema.virtual("isAvailable").get(function () {
  const now = new Date();
  return (
    this.status === "available" &&
    this.availableQuantity > 0 &&
    (!this.availableUntil || this.availableUntil > now)
  );
});

// Static method: Find nearby materials
materialSchema.statics.findNearby = function (coordinates, maxDistanceKm = 10, filters = {}) {
  const query = {
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: coordinates, // [longitude, latitude]
        },
        $maxDistance: maxDistanceKm * 1000, // Convert to meters
      },
    },
    status: "available",
    isApproved: true,
    ...filters,
  };

  return this.find(query);
};

// Static method: Find with distance calculation
materialSchema.statics.findWithDistance = function (coordinates, maxDistanceKm = 10, filters = {}) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: coordinates,
        },
        distanceField: "distance",
        maxDistance: maxDistanceKm * 1000,
        spherical: true,
        query: {
          status: "available",
          isApproved: true,
          ...filters,
        },
      },
    },
    {
      $addFields: {
        distanceKm: { $divide: ["$distance", 1000] },
      },
    },
  ]);
};

// Instance method: Increment view count
materialSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Instance method: Check if user can edit
materialSchema.methods.canEdit = function (userId) {
  return this.listedBy.toString() === userId.toString();
};

const Material = mongoose.model("Material", materialSchema);

export default Material;
