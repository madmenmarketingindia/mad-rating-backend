import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeId: {
      type: String,
      // unique: true,
      sparse: true,
    },

    firstName: { type: String, trim: true, required: false },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: false,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    residentialAddress: { type: String },
    permanentAddress: { type: String },

    officialDetails: {
      employeeType: {
        type: String,
      },
      department: { type: String },
      designation: { type: String },
      joiningDate: { type: Date, default: Date.now },
    },

    bankDetails: {
      bankName: { type: String },
      branchName: { type: String },
      accountHolderName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountType: {
        type: String,
        enum: ["Savings", "Current"],
        default: "Savings",
      },
    },

    salary: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      conveyanceAllowance: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      ctc: { type: Number, default: 0 },
    },

    employmentStatus: {
      type: String,
      enum: ["Active", "Resigned", "Terminated", "On Leave"],
      default: "Active",
    },

    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String, match: [/^[0-9]{10}$/, "Invalid phone number"] },
    },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
