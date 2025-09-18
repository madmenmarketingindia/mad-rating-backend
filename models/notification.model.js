import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    influencers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Influencer",
      },
    ],

    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["export", "remove"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  { timestamps: true }
);
notificationSchema.index({ requestedBy: 1, status: 1, createdAt: -1 });
export default mongoose.model("Notification", notificationSchema);
