import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
  {
    // Event type
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: [
        // User events
        "user_signup",
        "user_login",
        "user_logout",
        "profile_view",
        "profile_update",
        
        // Material events
        "material_view",
        "material_create",
        "material_update",
        "material_delete",
        "material_share",
        "material_save",
        "material_unsave",
        "material_search",
        "material_filter",
        
        // Request events
        "request_create",
        "request_approve",
        "request_reject",
        "request_cancel",
        "request_message",
        
        // Transaction events
        "transaction_create",
        "transaction_complete",
        "transaction_cancel",
        "transaction_dispute",
        
        // Logistics events
        "logistics_create",
        "logistics_assign",
        "logistics_pickup",
        "logistics_deliver",
        "logistics_fail",
        
        // Review events
        "review_create",
        "review_helpful_vote",
        
        // Impact events
        "impact_milestone",
        "leaderboard_view",
        
        // AI events
        "ai_suggestion_view",
        "ai_suggestion_accept",
        "ai_chat_start",
        "ai_chat_message",
        
        // System events
        "page_view",
        "feature_use",
        "error",
        "performance",
      ],
    },
    // User who triggered the event
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Anonymous user tracking
    sessionId: {
      type: String,
      trim: true,
    },
    // Related entities
    entities: {
      materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "MaterialRequest" },
      transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
      logisticsJobId: { type: mongoose.Schema.Types.ObjectId, ref: "LogisticsJob" },
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // Event properties
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Context
    context: {
      // Source of the event
      source: {
        type: String,
        enum: ["web", "mobile_ios", "mobile_android", "api", "admin"],
        default: "web",
      },
      // Page/screen where event occurred
      page: { type: String },
      // Referrer
      referrer: { type: String },
      // UTM parameters
      utm: {
        source: { type: String },
        medium: { type: String },
        campaign: { type: String },
        term: { type: String },
        content: { type: String },
      },
    },
    // Device info
    device: {
      type: { type: String }, // desktop, mobile, tablet
      os: { type: String },
      browser: { type: String },
      screenSize: { type: String },
    },
    // Location
    location: {
      city: { type: String },
      state: { type: String },
      country: { type: String },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: [Number],
      },
    },
    // Performance metrics (for performance events)
    performance: {
      loadTime: { type: Number }, // ms
      responseTime: { type: Number }, // ms
      renderTime: { type: Number }, // ms
    },
    // Error details (for error events)
    error: {
      message: { type: String },
      stack: { type: String },
      code: { type: String },
    },
    // Search/filter specific
    search: {
      query: { type: String },
      filters: { type: mongoose.Schema.Types.Mixed },
      resultsCount: { type: Number },
    },
    // Timestamp (for ordering)
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // IP address (for fraud detection, hashed)
    ipHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for querying
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ user: 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ "entities.materialId": 1, eventType: 1 });
analyticsEventSchema.index({ "entities.categoryId": 1, eventType: 1 });
analyticsEventSchema.index({ timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ "context.source": 1, eventType: 1 });
analyticsEventSchema.index({ "location.city": 1, eventType: 1 });

// TTL index to auto-delete old events (e.g., after 1 year)
analyticsEventSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

// Geospatial index for location-based queries
analyticsEventSchema.index({ "location.coordinates": "2dsphere" }, { sparse: true });

// Static method: Track event
analyticsEventSchema.statics.track = function (eventType, data = {}) {
  return this.create({
    eventType,
    user: data.userId || null,
    sessionId: data.sessionId || null,
    entities: data.entities || {},
    properties: data.properties || {},
    context: data.context || {},
    device: data.device || {},
    location: data.location || {},
    performance: data.performance || {},
    error: data.error || {},
    search: data.search || {},
    ipHash: data.ipHash || null,
    timestamp: data.timestamp || new Date(),
  });
};

// Static method: Get event counts by type
analyticsEventSchema.statics.getEventCounts = async function (filters = {}) {
  const match = {};
  
  if (filters.startDate) {
    match.timestamp = { $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    match.timestamp = match.timestamp || {};
    match.timestamp.$lte = new Date(filters.endDate);
  }
  if (filters.eventTypes) {
    match.eventType = { $in: filters.eventTypes };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Static method: Get daily active users
analyticsEventSchema.statics.getDailyActiveUsers = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        user: { $ne: null },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          user: "$user",
        },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        activeUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Static method: Get material view stats
analyticsEventSchema.statics.getMaterialViewStats = async function (materialId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        eventType: "material_view",
        "entities.materialId": new mongoose.Types.ObjectId(materialId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: "$user" },
      },
    },
    {
      $project: {
        date: "$_id",
        views: 1,
        uniqueViews: { $size: "$uniqueUsers" },
      },
    },
    { $sort: { date: 1 } },
  ]);
};

// Static method: Get search trends
analyticsEventSchema.statics.getSearchTrends = async function (days = 7, limit = 20) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        eventType: "material_search",
        timestamp: { $gte: startDate },
        "search.query": { $exists: true, $ne: "" },
      },
    },
    {
      $group: {
        _id: { $toLower: "$search.query" },
        count: { $sum: 1 },
        avgResults: { $avg: "$search.resultsCount" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
};

// Static method: Get conversion funnel
analyticsEventSchema.statics.getConversionFunnel = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const funnelSteps = [
    { name: "Material Views", event: "material_view" },
    { name: "Requests Created", event: "request_create" },
    { name: "Requests Approved", event: "request_approve" },
    { name: "Transactions Created", event: "transaction_create" },
    { name: "Transactions Completed", event: "transaction_complete" },
  ];

  const results = await Promise.all(
    funnelSteps.map(async (step) => {
      const count = await this.countDocuments({
        eventType: step.event,
        timestamp: { $gte: startDate },
      });
      return { name: step.name, count };
    })
  );

  return results;
};

// Static method: Get user engagement metrics
analyticsEventSchema.statics.getUserEngagement = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        uniqueDays: {
          $addToSet: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
        },
        eventTypes: { $addToSet: "$eventType" },
      },
    },
    {
      $project: {
        totalEvents: 1,
        daysActive: { $size: "$uniqueDays" },
        eventTypesCount: { $size: "$eventTypes" },
      },
    },
  ]);
};

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

export default AnalyticsEvent;
