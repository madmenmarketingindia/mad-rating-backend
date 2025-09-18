import mongoose from "mongoose";

const disciplinaryActionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      enum: ["Warning", "Suspension", "Termination Notice"],
      default: "Warning",
    },
    reason: { type: String, required: false },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Active", "Review", "Resolved"],
      default: "Active",
    },

    // Review fields
    reviewPeriodDays: { type: Number, default: 0 },
    reviewEndDate: { type: Date },
  },
  { timestamps: true }
);

const DisciplinaryAction = mongoose.model(
  "DisciplinaryAction",
  disciplinaryActionSchema
);

export default DisciplinaryAction;
