import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: { type: String },

    designations: [
      {
        title: { type: String, required: false },
      },
    ],

    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    // ratings summary (monthly, yearly)
    ratings: [
      {
        month: { type: Number },
        year: { type: Number },
        avgEthics: Number,
        avgDiscipline: Number,
        avgWorkEthics: Number,
        avgOutput: Number,
        avgTeamPlay: Number,
        avgLeadership: Number,
        avgExtraMile: Number,
        avgOverall: Number,
      },
    ],
  },
  { timestamps: true }
);

const Department = mongoose.model("Department", departmentSchema);
export default Department;
