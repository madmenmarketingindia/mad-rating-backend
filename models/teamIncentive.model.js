import mongoose from "mongoose";

const teamIncentiveSchema = new mongoose.Schema(
  {
    team: {
      type: String,
      required: true,
      trim: true,
    },

    members: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    month: {
      type: Number, // 1 - 12
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const TeamIncentive = mongoose.model("TeamIncentive", teamIncentiveSchema);
export default TeamIncentive;
