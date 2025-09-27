import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Holiday from "../models/holiday.model.js";

const createHoliday = async (req, res) => {
  try {
    const { name, date } = req.body;

    // Check duplicate by date
    const existing = await Holiday.findOne({ date });
    if (existing) {
      return res
        .status(409)
        .json(new apiError(409, "Holiday already exists on this date"));
    }

    const holiday = await Holiday.create({ name, date });
    return res
      .status(201)
      .json(
        apiResponseSuccess(
          holiday,
          true,
          statusCode.success,
          "Holiday created successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          holidays,
          true,
          statusCode.success,
          "Holidays fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json(new apiError(404, "Holiday not found"));
    }
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          holiday,
          true,
          statusCode.success,
          "Holiday details fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const updateHoliday = async (req, res) => {
  try {
    const updated = await Holiday.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json(new apiError(404, "Holiday not found"));
    }
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          updated,
          true,
          statusCode.success,
          "Holiday updated successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json(new apiError(400, error.message));
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const deleted = await Holiday.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json(new apiError(404, "Holiday not found"));
    }
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          deleted,
          true,
          statusCode.success,
          "Holiday deleted successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getHolidaysByMonth = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    // Start of month (UTC)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    // End of month (UTC)
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          holidays,
          true,
          statusCode.success,
          `Holidays for ${month}/${year} fetched successfully!`
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
  getHolidaysByMonth,
};
