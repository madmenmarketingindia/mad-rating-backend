import { apiResponseSuccess } from "../helper/serverError.js";
import { apiError } from "../utils/apiError.js";
import { statusCode } from "../helper/statusCodes.js";
import Employee from "../models/employee.model.js";
import Rating from "../models/rating.model.js";
import mongoose from "mongoose";

const getDepartmentStats = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1; // JS months are 0-indexed

    // ✅ Step 1: Get all employees grouped by department
    const employees = await Employee.aggregate([
      {
        $group: {
          _id: "$officialDetails.department",
          totalEmployees: { $sum: 1 },
        },
      },
    ]);

    // ✅ Step 2: Get average rating per department (filtered by current month & year)
    const ratings = await Rating.aggregate([
      {
        $match: {
          year: year,
          month: month,
        },
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
      {
        $group: {
          _id: "$employee.officialDetails.department",
          avgRating: { $avg: "$averageScore" },
        },
      },
    ]);

    // ✅ Step 3: Merge results
    const result = employees.map((dept) => {
      const ratingData = ratings.find((r) => r._id === dept._id);
      return {
        department: dept._id || "N/A",
        totalEmployees: dept.totalEmployees,
        avgRating: ratingData ? Number(ratingData.avgRating.toFixed(2)) : 0,
      };
    });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          result,
          true,
          statusCode.success,
          `Department stats for ${month}-${year} fetched successfully!`
        )
      );
  } catch (error) {
    console.error("Error in getDepartmentStats:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getDepartmentRatings = async (req, res) => {
  try {
    let { month, year } = req.query;

    // ✅ Default to current month/year
    const now = new Date();
    month = Number(month) || now.getMonth() + 1;
    year = Number(year) || now.getFullYear();

    // ✅ Fetch ratings for given month/year
    const ratings = await Rating.aggregate([
      { $match: { month, year } },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee.officialDetails.department",
          avgRating: { $avg: "$averageScore" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          department: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          count: 1,
          _id: 0,
        },
      },
      { $sort: { department: 1 } },
    ]);

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          ratings,
          true,
          statusCode.success,
          "Department-wise average rating fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getDepartmentRatings:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getBirthdaysByMonth = async (req, res) => {
  try {
    const now = new Date();
    const next30Days = 30;
    const todayDayOfYear = Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );

    const employees = await Employee.aggregate([
      {
        $addFields: {
          birthMonth: { $month: "$dateOfBirth" },
          birthDay: { $dayOfMonth: "$dateOfBirth" },
          birthDayOfYear: {
            $add: [
              {
                $dateDiff: {
                  startDate: {
                    $dateFromParts: {
                      year: { $year: "$dateOfBirth" },
                      month: 1,
                      day: 1,
                    },
                  },
                  endDate: "$dateOfBirth",
                  unit: "day",
                },
              },
              1,
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $concat: [
              { $ifNull: ["$firstName", ""] },
              " ",
              { $ifNull: ["$lastName", ""] },
            ],
          },
          designation: "$officialDetails.designation",
          birthday: {
            $dateToString: { format: "%d-%m", date: "$dateOfBirth" },
          },
          birthDay: 1,
          birthDayOfYear: 1,
        },
      },
    ]);

    // Filter birthdays in next 30 days
    const filtered = employees.filter((emp) => {
      const bDay = emp.birthDayOfYear;

      if (bDay >= todayDayOfYear) {
        return bDay <= todayDayOfYear + next30Days;
      } else {
        // Handle year wrap (Dec → Jan)
        return bDay + 365 <= todayDayOfYear + next30Days;
      }
    });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          filtered,
          true,
          statusCode.success,
          "Upcoming birthdays in next 30 days fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getUpcomingBirthdays:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getWorkAnniversariesByMonth = async (req, res) => {
  try {
    const now = new Date();
    const todayDayOfYear = Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );

    // Next 30 days range
    const next30 = 30;

    const employees = await Employee.aggregate([
      {
        $addFields: {
          joinMonth: { $month: "$officialDetails.joiningDate" },
          joinDay: { $dayOfMonth: "$officialDetails.joiningDate" },
          joinYear: { $year: "$officialDetails.joiningDate" },
          // Day of year for joiningDate
          joinDayOfYear: {
            $add: [
              {
                $dateDiff: {
                  startDate: {
                    $dateFromParts: {
                      year: { $year: "$officialDetails.joiningDate" },
                      month: 1,
                      day: 1,
                    },
                  },
                  endDate: "$officialDetails.joiningDate",
                  unit: "day",
                },
              },
              1,
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $concat: [
              { $ifNull: ["$firstName", ""] },
              " ",
              { $ifNull: ["$lastName", ""] },
            ],
          },
          designation: "$officialDetails.designation",
          joiningDate: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$officialDetails.joiningDate",
            },
          },
          joinDay: 1,
          joinYear: 1,
          joinDayOfYear: 1,
        },
      },
    ]);

    // Filter for next 30 days
    const filtered = employees.filter((emp) => {
      const anniversaryDayOfYear = emp.joinDayOfYear;

      // Handle year wrap around
      if (anniversaryDayOfYear >= todayDayOfYear) {
        return anniversaryDayOfYear <= todayDayOfYear + next30;
      } else {
        return anniversaryDayOfYear + 365 <= todayDayOfYear + next30;
      }
    });

    // Add years completed
    const enriched = filtered.map((emp) => ({
      ...emp,
      yearsCompleted: now.getFullYear() - emp.joinYear,
    }));

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          enriched,
          true,
          statusCode.success,
          "Employee work anniversaries for next 30 days fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getWorkAnniversariesNext30Days:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getEmployeeMonthlyRating = async (req, res) => {
  try {
    let { month, year, userId } = req.query; // Accept userId

    // ✅ Default to logged-in user
    if (!userId) {
      if (!req.user) {
        return res.status(400).json(new apiError(400, "User ID is required"));
      }
      userId = req.user._id;
    }

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json(new apiError(400, "Invalid User ID"));
    }
    const objectUserId = new mongoose.Types.ObjectId(userId);

    // ✅ Find Employee record
    const employee = await Employee.findOne({ userId: objectUserId });
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    const employeeId = employee._id;

    // ✅ Default month/year
    const now = new Date();
    month = Number(month) || now.getMonth() + 1;
    year = Number(year) || now.getFullYear();

    // ✅ Fetch rating
    let rating = await Rating.findOne({ employeeId, month, year }).lean();

    if (!rating) {
      // Fetch latest rating if specific month/year not found
      rating = await Rating.findOne({ employeeId })
        .sort({ year: -1, month: -1 })
        .lean();

      if (!rating) {
        return res
          .status(404)
          .json(new apiError(404, "No rating found for this employee"));
      }

      // Override month/year with latest
      month = rating.month;
      year = rating.year;
    }

    console.log(
      "Fetched rating for employeeId:",
      employeeId,
      "month:",
      month,
      "year:",
      year
    );

    // Extract only the needed categories
    const {
      discipline = 0,
      workEthics = 0,
      output = 0,
      teamPlay = 0,
      leadership = 0,
      extraMile = 0,
    } = rating.categories || {};

    const scores = [
      discipline,
      workEthics,
      output,
      teamPlay,
      leadership,
      extraMile,
    ];
    const avgRating = scores.length
      ? parseFloat(
          (scores.reduce((sum, val) => sum + val, 0) / scores.length).toFixed(2)
        )
      : 0;

    // ✅ Response
    return res.status(200).json(
      apiResponseSuccess(
        {
          employeeId,
          month,
          year,
          categories: {
            discipline,
            workEthics,
            output,
            teamPlay,
            leadership,
            extraMile,
          },
          avgRating,
        },
        true,
        statusCode.success,
        "Employee rating fetched successfully!"
      )
    );
  } catch (error) {
    console.error("Error in getEmployeeMonthlyRating:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getEmployeeYearlyRatings = async (req, res) => {
  try {
    let { userId } = req.query; // Pass userId (from JWT) or query param

    // ✅ Default to logged-in user
    if (!userId) {
      if (!req.user) {
        return res.status(400).json(new apiError(400, "User ID is required"));
      }
      userId = req.user._id;
    }

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json(new apiError(400, "Invalid User ID"));
    }
    const objectUserId = new mongoose.Types.ObjectId(userId);

    // ✅ Find Employee record
    const employee = await Employee.findOne({ userId: objectUserId });
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    const empId = employee._id;

    // ✅ Prepare last 12 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      // change 11 -> 5 for last 6 months
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    // ✅ Fetch ratings for this employee
    const ratings = await Rating.find({ employeeId: empId })
      .sort({ year: 1, month: 1 })
      .lean();

    // Map ratings for quick lookup
    const ratingsMap = {};
    ratings.forEach((r) => {
      const key = `${r.year}-${r.month}`;
      const {
        discipline = 0,
        workEthics = 0,
        output = 0,
        teamPlay = 0,
        leadership = 0,
        extraMile = 0,
      } = r.categories || {};

      const scores = [
        discipline,
        workEthics,
        output,
        teamPlay,
        leadership,
        extraMile,
      ];
      const avgRating = scores.length
        ? parseFloat(
            (scores.reduce((sum, val) => sum + val, 0) / scores.length).toFixed(
              2
            )
          )
        : 0;

      ratingsMap[key] = avgRating;
    });

    // Prepare response for graph plotting
    const responseData = months.map((m) => {
      const key = `${m.year}-${m.month}`;
      return {
        month: `${m.month}-${m.year}`,
        avgRating: ratingsMap[key] || 0, // default 0 if no rating
      };
    });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          responseData,
          true,
          statusCode.success,
          "Employee yearly ratings fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getEmployeeYearlyRatings:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getTeamYearlyRatings = async (req, res) => {
  try {
    let { year } = req.query;
    const now = new Date();
    year = Number(year) || now.getFullYear();

    // Step 1: Aggregate by department + month
    const ratings = await Rating.aggregate([
      { $match: { year } },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: {
            department: "$employee.officialDetails.department",
            month: "$month",
          },
          avgRating: { $avg: "$averageScore" },
        },
      },
      {
        $project: {
          department: "$_id.department",
          month: "$_id.month",
          avgRating: { $round: ["$avgRating", 2] },
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Step 2: Get unique departments
    const departments = [...new Set(ratings.map((r) => r.department))];

    // Step 3: Ensure all 12 months exist for each department
    const result = departments.flatMap((dept) => {
      const deptRatings = ratings.filter((r) => r.department === dept);
      const map = {};
      deptRatings.forEach((r) => {
        map[r.month] = r.avgRating;
      });

      return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return {
          department: dept || "N/A",
          month,
          avgRating: map[month] || 0,
        };
      });
    });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          result,
          true,
          statusCode.success,
          `Team average ratings for ${year} fetched successfully!`
        )
      );
  } catch (error) {
    console.error("Error in getTeamYearlyRatings:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  getDepartmentStats,
  getDepartmentRatings,
  getBirthdaysByMonth,
  getWorkAnniversariesByMonth,
  getEmployeeMonthlyRating,
  getEmployeeYearlyRatings,
  getTeamYearlyRatings,
};
