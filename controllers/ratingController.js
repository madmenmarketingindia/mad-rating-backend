import Rating from "../models/rating.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Employee from "../models/employee.model.js";

const upsertMonthlyRating = async (req, res) => {
  try {
    const { employeeId, reviewerId, month, year, categories } = req.body;

    // manual average calc
    const {
      ethics,
      discipline,
      workEthics,
      output,
      teamPlay,
      leadership,
      extraMile,
    } = categories;

    const averageScore = Number(
      (
        (ethics +
          discipline +
          workEthics +
          output +
          teamPlay +
          leadership +
          extraMile) /
        7
      ).toFixed(2)
    );

    const rating = await Rating.findOneAndUpdate(
      { employeeId, month, year },
      { employeeId, reviewerId, month, year, categories, averageScore },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          rating,
          true,
          statusCode.success,
          "Monthly rating saved/updated successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getCurrentRating = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Try to find current month rating
    let rating = await Rating.findOne({ employeeId, month, year });

    if (!rating) {
      // If no rating → return default object
      const defaultCategories = {
        ethics: 0,
        discipline: 0,
        workEthics: 0,
        output: 0,
        teamPlay: 0,
        leadership: 0,
        extraMile: 0,
      };

      const defaultRating = {
        employeeId,
        month,
        year,
        categories: defaultCategories,
        averageScore: 0,
      };

      return res
        .status(200)
        .json(
          apiResponseSuccess(
            defaultRating,
            true,
            statusCode.success,
            "No rating found for current month. Returning default values."
          )
        );
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          rating,
          true,
          statusCode.success,
          "Rating fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getRatingHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const ratings = await Rating.find({ employeeId }).sort({
      year: -1,
      month: -1,
    });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          ratings,
          true,
          statusCode.success,
          "Rating history fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getEmployeeRatings = async (req, res) => {
  try {
    const { name, month, year } = req.query;

    // Build query object
    let query = {};

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    // If searching by employee name
    let employeeFilter = {};
    if (name) {
      employeeFilter = {
        $or: [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
        ],
      };
    }

    // First find employees matching name filter
    const employees = await Employee.find(employeeFilter).select(
      "_id firstName lastName email"
    );
    const employeeIds = employees.map((e) => e._id);

    if (employeeIds.length > 0) {
      query.employeeId = { $in: employeeIds };
    }

    // Fetch ratings with employee details populated
    const ratings = await Rating.find(query)
      .populate("employeeId", "firstName lastName email officialDetails, _id")
      .populate("reviewerId", "username email")
      .sort({ year: -1, month: -1 });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          ratings,
          true,
          statusCode.success,
          "Employee ratings fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getSingleMonthRating = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { month, year } = req.query;

    const now = new Date();

    // Default to current month/year if not provided
    month = month ? Number(month) : now.getMonth() + 1;
    year = year ? Number(year) : now.getFullYear();

    // Find rating
    let rating = await Rating.findOne({ employeeId, month, year })
      .populate("employeeId", "firstName lastName email officialDetails _id")
      .populate("reviewerId", "username email");

    if (!rating) {
      // No rating → return default object
      const defaultCategories = {
        ethics: 0,
        discipline: 0,
        workEthics: 0,
        output: 0,
        teamPlay: 0,
        leadership: 0,
        extraMile: 0,
      };

      const defaultRating = {
        employeeId,
        month,
        year,
        categories: defaultCategories,
        averageScore: 0,
      };

      return res
        .status(200)
        .json(
          apiResponseSuccess(
            defaultRating,
            true,
            statusCode.success,
            "No rating found for this month. Returning default values."
          )
        );
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          rating,
          true,
          statusCode.success,
          "Rating fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  upsertMonthlyRating,
  getCurrentRating,
  getRatingHistory,
  getEmployeeRatings,
  getSingleMonthRating,
};
