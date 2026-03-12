import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "ngo", "logistics_partner", "admin"],
      default: "buyer",
    },
    // GeoJSON location for user's primary address
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, default: "India" },
    },
    // Verification status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    // Business-specific details
    businessDetails: {
      companyName: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      businessType: {
        type: String,
        enum: ["manufacturer", "retailer", "wholesaler", "recycler", "other"],
      },
      website: { type: String, trim: true },
    },
    // NGO-specific details
    ngoDetails: {
      registrationNumber: { type: String, trim: true },
      focusArea: { type: String, trim: true },
    },
    // Impact statistics (cached for performance)
    impactStats: {
      totalListings: { type: Number, default: 0 },
      totalTransactions: { type: Number, default: 0 },
      weightDiverted: { type: Number, default: 0 }, // in kg
      co2Saved: { type: Number, default: 0 }, // in kg
    },
    // Rating
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    // Auth tokens
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Firebase UID for OAuth users
    firebaseUid: {
      type: String,
    },
    // Notification preferences
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    // FCM token for push notifications
    fcmToken: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (email has unique:true so no need to add index)
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ location: "2dsphere" });
userSchema.index({ firebaseUid: 1 }, { sparse: true });
userSchema.index({ "address.city": 1 });
userSchema.index({ isActive: 1, isBanned: 1 });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive fields)
userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    avatar: this.avatar,
    role: this.role,
    address: {
      city: this.address?.city,
      state: this.address?.state,
    },
    rating: this.rating,
    impactStats: this.impactStats,
    createdAt: this.createdAt,
  };
};

// Virtual for full address
userSchema.virtual("fullAddress").get(function () {
  const { street, city, state, pincode, country } = this.address || {};
  return [street, city, state, pincode, country].filter(Boolean).join(", ");
});

const User = mongoose.model("User", userSchema);

export default User;
