import mongoose from "mongoose";
const { Schema } = mongoose;

const AttendancePayrollSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    hra: { type: Number, required: true },
    medicalAllowance: { type: Number, required: true },
    conveyanceAllowance: { type: Number, required: true },
    // Salary Info (manual override allowed)
    salary: { type: Number, required: true },
    totalDays: { type: Number, required: true },
    present: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    leaveAdjusted: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    lateIn: { type: Number, default: 0 },
    lateAdjusted: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    payableDays: { type: Number, default: 0 },
    teamIncentive: { type: Number, default: 0 },
    individualIncentive: { type: Number, default: 0 },
    companyIncentive: { type: Number, default: 0 },
    enableTeamIncentive: {
      type: Boolean,
      default: false,
    },
    enableCompanyIncentive: {
      type: Boolean,
      default: false,
    },

    enableIndividualIncentive: {
      type: Boolean,
      default: false,
    },
    // Bank info (override allowed)
    bankName: { type: String },
    accountNo: { type: String },
    ifscCode: { type: String },

    // Payment details
    advanceAmount: { type: Number, default: 0 },
    payable: { type: Number, default: 0 },
    reimbursement: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    // Status of payroll
    status: {
      type: String,
      enum: ["Not Processed", "Pending", "Processed", "Paid"],
      default: "Not Processed",
    },
  },
  { timestamps: true }
);

const AttendancePayroll = mongoose.model(
  "AttendancePayroll",
  AttendancePayrollSchema
);
export default AttendancePayroll;
