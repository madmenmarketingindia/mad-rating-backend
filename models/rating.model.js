import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Monthly key
    month: { type: Number, required: true },
    year: { type: Number, required: true },

    categories: {
      ethics: { type: Number, min: 1, max: 5, required: false },
      discipline: { type: Number, min: 1, max: 5, required: false },
      workEthics: { type: Number, min: 1, max: 5, required: false },
      output: { type: Number, min: 1, max: 5, required: false },
      teamPlay: { type: Number, min: 1, max: 5, required: false },
      leadership: { type: Number, min: 1, max: 5, required: false },
      extraMile: { type: Number, min: 1, max: 5, required: false },
    },

    averageScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Calculate average before save
ratingSchema.pre("save", function (next) {
  const {
    ethics,
    discipline,
    workEthics,
    output,
    teamPlay,
    leadership,
    extraMile,
  } = this.categories;
  this.averageScore = (
    (ethics +
      discipline +
      workEthics +
      output +
      teamPlay +
      leadership +
      extraMile) /
    7
  ).toFixed(2);
  next();
});

// Ensure unique rating per employee per month-year
ratingSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Export the model
const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
