import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Holiday date is required"],
      unique: true,
    },
    day: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Pre-save hook to automatically calculate day from date
holidaySchema.pre("save", function (next) {
  const options = { weekday: "long" };
  this.day = this.date.toLocaleDateString("en-US", options);
  next();
});

// Pre-update hook for findOneAndUpdate
holidaySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.date) {
    const options = { weekday: "long" };
    update.day = new Date(update.date).toLocaleDateString("en-US", options);
    this.setUpdate(update);
  }
  next();
});

const Holiday = mongoose.model("Holiday", holidaySchema);
export default Holiday;
