import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // Transaction this review is for
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction reference is required"],
    },
    // Who wrote the review
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer reference is required"],
    },
    // Who is being reviewed
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewee reference is required"],
    },
    // Review context
    reviewerRole: {
      type: String,
      enum: ["supplier", "receiver"],
      required: true,
    },
    // Material reference
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
    },
    // Overall rating (1-5 stars)
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    // Detailed ratings
    detailedRatings: {
      // For suppliers reviewing receivers
      communication: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      reliability: { type: Number, min: 1, max: 5 },
      
      // For receivers reviewing suppliers
      materialQuality: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 }, // Material as described
      packaging: { type: Number, min: 1, max: 5 },
    },
    // Written review
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    // Pros and cons
    pros: [
      {
        type: String,
        trim: true,
      },
    ],
    cons: [
      {
        type: String,
        trim: true,
      },
    ],
    // Tags (quick feedback options)
    tags: [
      {
        type: String,
        enum: [
          // Positive
          "great_communication",
          "fast_response",
          "as_described",
          "well_packed",
          "on_time",
          "helpful",
          "professional",
          "would_deal_again",
          
          // Negative
          "poor_communication",
          "slow_response",
          "not_as_described",
          "poor_packaging",
          "late",
          "unhelpful",
          "unprofessional",
        ],
      },
    ],
    // Images (proof of transaction quality)
    images: [
      {
        url: { type: String },
        caption: { type: String, trim: true },
      },
    ],
    // Would recommend
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
    // Response from reviewee
    response: {
      message: { type: String, trim: true, maxlength: 1000 },
      respondedAt: { type: Date },
    },
    // Helpfulness votes
    helpfulness: {
      helpful: { type: Number, default: 0 },
      notHelpful: { type: Number, default: 0 },
      voters: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          vote: { type: String, enum: ["helpful", "not_helpful"] },
        },
      ],
    },
    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "approved", // Auto-approve, change to 'pending' for manual moderation
    },
    moderationNotes: {
      type: String,
      trim: true,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      trim: true,
    },
    // Visibility
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Edit history
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        rating: { type: Number },
        comment: { type: String },
        editedAt: { type: Date, default: Date.now },
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
reviewSchema.index({ transaction: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1, status: 1 });
reviewSchema.index({ material: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ status: 1 });

// Compound index for unique review per transaction per role
reviewSchema.index(
  { transaction: 1, reviewer: 1 },
  { unique: true }
);

// Virtual for helpfulness score
reviewSchema.virtual("helpfulnessScore").get(function () {
  const total = this.helpfulness.helpful + this.helpfulness.notHelpful;
  if (total === 0) return 0;
  return ((this.helpfulness.helpful / total) * 100).toFixed(0);
});

// Post-save: Update user's average rating
reviewSchema.post("save", async function () {
  const Review = this.constructor;
  
  // Calculate new average rating for reviewee
  const stats = await Review.aggregate([
    {
      $match: {
        reviewee: this.reviewee,
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(this.reviewee, {
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
      "rating.count": stats[0].count,
    });
  }
});

// Instance method: Add response
reviewSchema.methods.addResponse = async function (message) {
  this.response = {
    message,
    respondedAt: new Date(),
  };
  return this.save();
};

// Instance method: Vote helpful
reviewSchema.methods.voteHelpful = async function (userId, isHelpful) {
  // Check if user already voted
  const existingVote = this.helpfulness.voters.find(
    (v) => v.user.toString() === userId.toString()
  );

  if (existingVote) {
    // Update existing vote
    if (existingVote.vote === "helpful") this.helpfulness.helpful--;
    else this.helpfulness.notHelpful--;

    existingVote.vote = isHelpful ? "helpful" : "not_helpful";
  } else {
    // Add new vote
    this.helpfulness.voters.push({
      user: userId,
      vote: isHelpful ? "helpful" : "not_helpful",
    });
  }

  if (isHelpful) this.helpfulness.helpful++;
  else this.helpfulness.notHelpful++;

  return this.save();
};

// Instance method: Edit review
reviewSchema.methods.editReview = async function (newRating, newComment) {
  // Store old values in history
  this.editHistory.push({
    rating: this.rating,
    comment: this.comment,
    editedAt: new Date(),
  });

  this.rating = newRating;
  this.comment = newComment;
  this.isEdited = true;

  return this.save();
};

// Static method: Get reviews for user
reviewSchema.statics.getForUser = function (userId, options = {}) {
  const { page = 1, limit = 10, role = null } = options;

  const query = {
    reviewee: userId,
    status: "approved",
  };

  if (role) query.reviewerRole = role;

  return this.find(query)
    .populate("reviewer", "name avatar")
    .populate("material", "title primaryImage")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method: Get rating distribution
reviewSchema.statics.getRatingDistribution = async function (userId) {
  const distribution = await this.aggregate([
    {
      $match: {
        reviewee: new mongoose.Types.ObjectId(userId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  // Convert to object with all ratings
  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach(({ _id, count }) => {
    result[_id] = count;
  });

  return result;
};

// Static method: Check if user can review
reviewSchema.statics.canReview = async function (transactionId, reviewerId) {
  const existing = await this.findOne({
    transaction: transactionId,
    reviewer: reviewerId,
  });
  return !existing;
};

const Review = mongoose.model("Review", reviewSchema);

export default Review;
