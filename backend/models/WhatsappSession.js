import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    flow: {
      type: String,
      enum: ["none", "add_listing"],
      default: "none",
    },
    step: {
      type: String,
      default: "idle",
    },
    draft: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastIncomingMessageId: {
      type: String,
      default: null,
    },
    lastIncomingAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

whatsappSessionSchema.index({ phoneNumber: 1, chatId: 1 }, { unique: true });

const WhatsappSession = mongoose.model("WhatsappSession", whatsappSessionSchema);

export default WhatsappSession;
