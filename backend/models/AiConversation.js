import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    // User who initiated the conversation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    // Conversation type
    type: {
      type: String,
      enum: [
        "reuse_suggestion",      // AI suggesting reuse ideas
        "categorization",        // AI helping categorize material
        "matching",              // AI finding matches
        "general_assistant",     // General Q&A
        "impact_analysis",       // Analyzing environmental impact
        "price_suggestion",      // Suggesting prices
        "description_generation", // Generating material descriptions
      ],
      required: [true, "Conversation type is required"],
    },
    // Title (auto-generated or user-provided)
    title: {
      type: String,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    // Related material (if applicable)
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
    },
    // Messages in the conversation
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        // Structured data (for AI responses with structured output)
        structuredData: {
          type: mongoose.Schema.Types.Mixed,
        },
        // Token usage
        tokens: {
          prompt: { type: Number },
          completion: { type: Number },
          total: { type: Number },
        },
        // Model used
        model: {
          type: String,
        },
        // Response time in ms
        responseTime: {
          type: Number,
        },
        // Feedback on this message
        feedback: {
          rating: {
            type: String,
            enum: ["helpful", "not_helpful", "neutral"],
          },
          comment: { type: String, trim: true },
          givenAt: { type: Date },
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Suggestions generated
    suggestions: [
      {
        type: {
          type: String,
          enum: [
            "reuse_idea",
            "category",
            "subcategory",
            "price",
            "tags",
            "potential_buyer",
            "similar_material",
          ],
        },
        value: { type: mongoose.Schema.Types.Mixed },
        confidence: { type: Number, min: 0, max: 1 },
        accepted: { type: Boolean, default: null },
        acceptedAt: { type: Date },
      },
    ],
    // Context provided to AI
    context: {
      materialData: { type: mongoose.Schema.Types.Mixed },
      userPreferences: { type: mongoose.Schema.Types.Mixed },
      locationData: { type: mongoose.Schema.Types.Mixed },
      previousInteractions: { type: Number, default: 0 },
    },
    // Conversation status
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    // Model configuration used
    modelConfig: {
      model: {
        type: String,
        default: "gpt-4",
      },
      temperature: {
        type: Number,
        default: 0.7,
      },
      maxTokens: {
        type: Number,
        default: 1000,
      },
      systemPrompt: {
        type: String,
      },
    },
    // Usage statistics
    usage: {
      totalTokens: { type: Number, default: 0 },
      totalMessages: { type: Number, default: 0 },
      totalResponseTime: { type: Number, default: 0 }, // ms
      estimatedCost: { type: Number, default: 0 }, // in USD cents
    },
    // Overall feedback
    overallFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      givenAt: { type: Date },
    },
    // Session tracking
    sessionId: {
      type: String,
    },
    // Source
    source: {
      type: String,
      enum: ["web_chat", "mobile_chat", "inline_suggestion", "api"],
      default: "web_chat",
    },
    // Last activity
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
aiConversationSchema.index({ user: 1, createdAt: -1 });
aiConversationSchema.index({ type: 1 });
aiConversationSchema.index({ material: 1 });
aiConversationSchema.index({ status: 1 });
aiConversationSchema.index({ lastActivityAt: -1 });
aiConversationSchema.index({ sessionId: 1 });

// Virtual: Message count
aiConversationSchema.virtual("messageCount").get(function () {
  return this.messages?.length || 0;
});

// Virtual: Average response time
aiConversationSchema.virtual("avgResponseTime").get(function () {
  if (!this.messages || this.messages.length === 0) return 0;
  const assistantMessages = this.messages.filter(
    (m) => m.role === "assistant" && m.responseTime
  );
  if (assistantMessages.length === 0) return 0;
  const total = assistantMessages.reduce((acc, m) => acc + m.responseTime, 0);
  return Math.round(total / assistantMessages.length);
});

// Pre-save: Update usage stats
aiConversationSchema.pre("save", function () {
  if (this.isModified("messages")) {
    const messages = this.messages || [];
    
    this.usage.totalMessages = messages.length;
    this.usage.totalTokens = messages.reduce(
      (acc, m) => acc + (m.tokens?.total || m.tokens?.total_tokens || 0),
      0
    );
    this.usage.totalResponseTime = messages
      .filter((m) => m.role === "assistant")
      .reduce((acc, m) => acc + (m.responseTime || 0), 0);
    
    // Estimate cost (rough estimate: $0.01 per 1k tokens for GPT-4)
    this.usage.estimatedCost = Math.ceil(this.usage.totalTokens / 1000) * 1;
    
    // Update last activity
    this.lastActivityAt = new Date();
  }
});

// Instance method: Add user message
aiConversationSchema.methods.addUserMessage = function (content) {
  this.messages.push({
    role: "user",
    content,
    timestamp: new Date(),
  });
  return this.save();
};

// Instance method: Add assistant response
aiConversationSchema.methods.addAssistantResponse = function (response) {
  const {
    content,
    structuredData = null,
    tokens = {},
    model = "gpt-4",
    responseTime = 0,
  } = response;

  this.messages.push({
    role: "assistant",
    content,
    structuredData,
    tokens,
    model,
    responseTime,
    timestamp: new Date(),
  });

  return this.save();
};

// Instance method: Add suggestion
aiConversationSchema.methods.addSuggestion = function (suggestion) {
  this.suggestions.push({
    type: suggestion.type,
    value: suggestion.value,
    confidence: suggestion.confidence || 0.5,
    accepted: null,
  });
  return this.save();
};

// Instance method: Accept/reject suggestion
aiConversationSchema.methods.respondToSuggestion = function (index, accepted) {
  if (this.suggestions[index]) {
    this.suggestions[index].accepted = accepted;
    this.suggestions[index].acceptedAt = accepted ? new Date() : undefined;
  }
  return this.save();
};

// Instance method: Add feedback to message
aiConversationSchema.methods.addMessageFeedback = function (
  messageIndex,
  rating,
  comment = ""
) {
  if (this.messages[messageIndex]) {
    this.messages[messageIndex].feedback = {
      rating,
      comment,
      givenAt: new Date(),
    };
  }
  return this.save();
};

// Instance method: Complete conversation
aiConversationSchema.methods.complete = function (rating = null, comment = "") {
  this.status = "completed";
  if (rating) {
    this.overallFeedback = {
      rating,
      comment,
      givenAt: new Date(),
    };
  }
  return this.save();
};

// Instance method: Archive conversation
aiConversationSchema.methods.archive = function () {
  this.status = "archived";
  return this.save();
};

// Static method: Get user's recent conversations
aiConversationSchema.statics.getRecentForUser = function (userId, limit = 10) {
  return this.find({ user: userId, status: { $ne: "archived" } })
    .sort({ lastActivityAt: -1 })
    .limit(limit)
    .select("title type status lastActivityAt messageCount");
};

// Static method: Get conversation statistics
aiConversationSchema.statics.getStats = async function (filters = {}) {
  const match = {};
  if (filters.startDate) match.createdAt = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    match.createdAt = match.createdAt || {};
    match.createdAt.$lte = new Date(filters.endDate);
  }
  if (filters.type) match.type = filters.type;

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        totalConversations: { $sum: 1 },
        totalMessages: { $sum: { $size: "$messages" } },
        totalTokens: { $sum: "$usage.totalTokens" },
        avgMessagesPerConv: { $avg: { $size: "$messages" } },
        totalCost: { $sum: "$usage.estimatedCost" },
      },
    },
    { $sort: { totalConversations: -1 } },
  ]);
};

// Static method: Get suggestion acceptance rate
aiConversationSchema.statics.getSuggestionAcceptanceRate = async function (type = null) {
  const match = {};
  if (type) match["suggestions.type"] = type;

  return this.aggregate([
    { $match: match },
    { $unwind: "$suggestions" },
    {
      $group: {
        _id: "$suggestions.type",
        total: { $sum: 1 },
        accepted: {
          $sum: { $cond: [{ $eq: ["$suggestions.accepted", true] }, 1, 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$suggestions.accepted", false] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$suggestions.accepted", null] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        type: "$_id",
        total: 1,
        accepted: 1,
        rejected: 1,
        pending: 1,
        acceptanceRate: {
          $cond: [
            { $eq: [{ $add: ["$accepted", "$rejected"] }, 0] },
            0,
            {
              $multiply: [
                { $divide: ["$accepted", { $add: ["$accepted", "$rejected"] }] },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);
};

const AiConversation = mongoose.model("AiConversation", aiConversationSchema);

export default AiConversation;
