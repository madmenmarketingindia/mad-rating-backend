import mongoose from "mongoose";

const FNFSettlementSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },

    noticePeriodDays: { type: Number, default: 60 },
    resignationDate: { type: Date },
    lastWorkingDay: { type: Date },
    reasonForSeparation: { type: String },

    salaryDetails: {
      unpaidSalary: { type: Number, default: 0 },
      leaveEncashment: { type: Number, default: 0 },
      reimbursements: { type: Number, default: 0 },
      bonusOrAdjustments: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      advanceAmount: { type: Number, default: 0 },
      totalPayable: { type: Number, default: 0 },
    },

    payrollRefs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttendancePayroll",
      },
    ],

    statusFlow: {
      clearanceStatus: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
      },
      fnfStatus: {
        type: String,
        enum: ["pending", "inReview", "approved", "paid"],
        default: "pending",
      },
      initiatedOn: { type: Date },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvedOn: { type: Date },
      paidOn: { type: Date },
      remarks: { type: String },
    },
  },
  { timestamps: true }
);

const FNFSettlement = mongoose.model("FNFSettlement", FNFSettlementSchema);
export default FNFSettlement;
