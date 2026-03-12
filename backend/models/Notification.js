import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Recipient user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    // Notification type
    type: {
      type: String,
      enum: [
        // Request-related
        "request_received",
        "request_approved",
        "request_rejected",
        "request_cancelled",
        "request_expired",
        "new_message",
        
        // Transaction-related
        "transaction_created",
        "transaction_scheduled",
        "transaction_in_progress",
        "transaction_completed",
        "transaction_disputed",
        "transaction_cancelled",
        
        // Logistics-related
        "logistics_assigned",
        "logistics_pickup_soon",
        "logistics_picked_up",
        "logistics_in_transit",
        "logistics_delivered",
        "logistics_failed",
        
        // Material-related
        "material_expiring",
        "material_views_milestone",
        "material_request_count",
        "similar_material_available",
        
        // Review-related
        "review_received",
        "review_reminder",
        
        // Impact-related
        "impact_milestone",
        "leaderboard_rank_change",
        
        // System
        "system_announcement",
        "account_verified",
        "welcome",
        "profile_incomplete",
        
        // AI suggestions
        "ai_reuse_suggestion",
        "ai_match_found",
      ],
      required: [true, "Notification type is required"],
    },
    // Title and message
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    // Related data references
    data: {
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "MaterialRequest" },
      transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
      logisticsJobId: { type: mongoose.Schema.Types.ObjectId, ref: "LogisticsJob" },
      reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      // Additional custom data
      extra: { type: mongoose.Schema.Types.Mixed },
    },
    // Action URL (deep link)
    actionUrl: {
      type: String,
      trim: true,
    },
    // Action button text
    actionText: {
      type: String,
      trim: true,
      default: "View",
    },
    // Image/icon
    image: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: "bell",
    },
    // Priority
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Delivery status
    channels: {
      inApp: {
        sent: { type: Boolean, default: true },
        sentAt: { type: Date, default: Date.now },
      },
      push: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        error: { type: String },
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        error: { type: String },
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        error: { type: String },
      },
    },
    // Grouping key (for batching similar notifications)
    groupKey: {
      type: String,
      trim: true,
    },
    // Expiration
    expiresAt: {
      type: Date,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ user: 1, isDeleted: 1 });
notificationSchema.index({ groupKey: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
notificationSchema.index({ createdAt: -1 });

// Virtual for time since created
notificationSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
});

// Instance method: Mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method: Soft delete
notificationSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method: Get unread count for user
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    isDeleted: false,
  });
};

// Static method: Get notifications for user
notificationSchema.statics.getForUser = function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    types = null,
  } = options;

  const query = {
    user: userId,
    isDeleted: false,
  };

  if (unreadOnly) query.isRead = false;
  if (types && types.length > 0) query.type = { $in: types };

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method: Mark all as read for user
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method: Create notification with proper defaults
notificationSchema.statics.createNotification = async function ({
  user,
  type,
  title,
  message,
  data = {},
  actionUrl = null,
  actionText = "View",
  priority = "normal",
  expiresIn = null, // in milliseconds
}) {
  const notification = new this({
    user,
    type,
    title,
    message,
    data,
    actionUrl,
    actionText,
    priority,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : null,
  });

  return notification.save();
};

// Static method: Bulk create notifications (for announcements)
notificationSchema.statics.createBulkNotifications = async function (userIds, notificationData) {
  const notifications = userIds.map((userId) => ({
    user: userId,
    ...notificationData,
    channels: {
      inApp: { sent: true, sentAt: new Date() },
      push: { sent: false },
      email: { sent: false },
      sms: { sent: false },
    },
  }));

  return this.insertMany(notifications);
};

// Static method: Delete old notifications (cleanup job)
notificationSchema.statics.deleteOldNotifications = function (daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
