import Rating from "../models/rating.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Employee from "../models/employee.model.js";
import mongoose from "mongoose";

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

    // Employee name filter
    let employeeFilter = {};
    if (name) {
      employeeFilter = {
        $or: [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
        ],
      };
    }

    const employees = await Employee.find(employeeFilter).select(
      "_id firstName lastName email"
    );
    const employeeIds = employees.map((e) => e._id);

    if (employeeIds.length > 0) {
      query.employeeId = { $in: employeeIds };
    }

    // Fetch all ratings for these employees
    const ratings = await Rating.find(query)
      .populate("employeeId", "_id firstName lastName email")
      .sort({ employeeId: 1, year: -1, month: -1 });

    // Group ratings by employee and calculate average
    const employeeMap = {};

    ratings.forEach((r) => {
      const empId = r.employeeId._id.toString();

      if (!employeeMap[empId]) {
        employeeMap[empId] = {
          employeeId: r.employeeId,
          categories: {
            ethics: 0,
            discipline: 0,
            workEthics: 0,
            output: 0,
            teamPlay: 0,
            leadership: 0,
            extraMile: 0,
          },
          totalMonths: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const cat = r.categories;

      employeeMap[empId].categories.ethics += cat.ethics;
      employeeMap[empId].categories.discipline += cat.discipline;
      employeeMap[empId].categories.workEthics += cat.workEthics;
      employeeMap[empId].categories.output += cat.output;
      employeeMap[empId].categories.teamPlay += cat.teamPlay;
      employeeMap[empId].categories.leadership += cat.leadership;
      employeeMap[empId].categories.extraMile += cat.extraMile;

      employeeMap[empId].totalMonths += 1;
    });

    // Convert to array and calculate average per category
    const result = Object.values(employeeMap).map((e) => {
      const months = e.totalMonths;

      const categories = {
        ethics: +(e.categories.ethics / months).toFixed(2),
        discipline: +(e.categories.discipline / months).toFixed(2),
        workEthics: +(e.categories.workEthics / months).toFixed(2),
        output: +(e.categories.output / months).toFixed(2),
        teamPlay: +(e.categories.teamPlay / months).toFixed(2),
        leadership: +(e.categories.leadership / months).toFixed(2),
        extraMile: +(e.categories.extraMile / months).toFixed(2),
      };

      const averageScore = +(
        (categories.ethics +
          categories.discipline +
          categories.workEthics +
          categories.output +
          categories.teamPlay +
          categories.leadership +
          categories.extraMile) /
        7
      ).toFixed(2);

      return {
        _id: e.employeeId._id,
        employeeId: e.employeeId,
        categories,
        averageScore,
        totalMonths: months,
      };
    });

    return res.status(200).json({
      data: result,
      success: true,
      successCode: 200,
      message: "Employee ratings fetched successfully!",
      pagination: null,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      success: false,
      errors: [],
    });
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

const getEmployeeYearlyRatings = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    // Aggregate by month using averageScore
    const ratings = await Rating.aggregate([
      {
        $match: {
          employeeId: new mongoose.Types.ObjectId(employeeId),
          year: selectedYear,
        },
      },
      {
        $group: {
          _id: "$month",
          avgRating: { $avg: "$averageScore" }, // use averageScore field
        },
      },
      {
        $project: {
          month: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Fill missing months with 0
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthData = ratings.find((r) => r.month === i + 1);
      return {
        month: i + 1,
        avgRating: monthData ? monthData.avgRating : 0,
      };
    });

    return res.status(200).json({
      success: true,
      successCode: 200,
      message: "Employee yearly rating data fetched successfully!",
      data: {
        employeeId,
        year: selectedYear,
        ratings: monthlyData,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTeamWiseRatings = async (req, res) => {
  try {
    let { month, year } = req.query;

    const now = new Date();
    month = month ? Number(month) : now.getMonth() + 1;
    year = year ? Number(year) : now.getFullYear();

    const teamRatings = await Rating.aggregate([
      {
        $match: { month, year },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      // ✅ First group at employee level
      {
        $group: {
          _id: "$employee._id",
          department: { $first: "$employee.officialDetails.department" },
          firstName: { $first: "$employee.firstName" },
          lastName: { $first: "$employee.lastName" },
          designation: { $first: "$employee.officialDetails.designation" },

          avgEthics: { $avg: "$categories.ethics" },
          avgDiscipline: { $avg: "$categories.discipline" },
          avgWorkEthics: { $avg: "$categories.workEthics" },
          avgOutput: { $avg: "$categories.output" },
          avgTeamPlay: { $avg: "$categories.teamPlay" },
          avgLeadership: { $avg: "$categories.leadership" },
          avgExtraMile: { $avg: "$categories.extraMile" },
          avgOverall: { $avg: "$averageScore" },
        },
      },

      // ✅ Then group at department level
      {
        $group: {
          _id: "$department",
          avgEthics: { $avg: "$avgEthics" },
          avgDiscipline: { $avg: "$avgDiscipline" },
          avgWorkEthics: { $avg: "$avgWorkEthics" },
          avgOutput: { $avg: "$avgOutput" },
          avgTeamPlay: { $avg: "$avgTeamPlay" },
          avgLeadership: { $avg: "$avgLeadership" },
          avgExtraMile: { $avg: "$avgExtraMile" },
          avgOverall: { $avg: "$avgOverall" },

          employees: {
            $push: {
              employeeId: "$_id",
              firstName: "$firstName",
              lastName: "$lastName",
              designation: "$designation",
              avgOverall: { $round: ["$avgOverall", 2] }, // 👈 each employee’s personal avg
            },
          },
          totalEmployees: { $sum: 1 },
        },
      },

      // ✅ Clean projection
      {
        $project: {
          department: "$_id",
          _id: 0,
          avgEthics: { $round: ["$avgEthics", 2] },
          avgDiscipline: { $round: ["$avgDiscipline", 2] },
          avgWorkEthics: { $round: ["$avgWorkEthics", 2] },
          avgOutput: { $round: ["$avgOutput", 2] },
          avgTeamPlay: { $round: ["$avgTeamPlay", 2] },
          avgLeadership: { $round: ["$avgLeadership", 2] },
          avgExtraMile: { $round: ["$avgExtraMile", 2] },
          avgOverall: { $round: ["$avgOverall", 2] },
          employees: 1,
          totalEmployees: 1,
        },
      },
      { $sort: { department: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Department-wise ratings fetched successfully!",
      data: {
        month,
        year,
        departments: teamRatings,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  upsertMonthlyRating,
  getCurrentRating,
  getRatingHistory,
  getEmployeeRatings,
  getSingleMonthRating,
  getEmployeeYearlyRatings,
  getTeamWiseRatings,
};
