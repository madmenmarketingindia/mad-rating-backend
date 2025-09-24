import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Employee from "../models/employee.model.js";
import TeamIncentive from "../models/teamIncentive.model.js";

// const createIncentive = async (req, res) => {
//   try {
//     const { team, memberIds, totalAmount, month, year } = req.body;
//     const createdBy = req.user?._id || req.body.createdBy;

//     // Validation
//     if (!team || !Array.isArray(memberIds) || memberIds.length === 0) {
//       return res
//         .status(400)
//         .json(new apiError(400, "Team and members are required"));
//     }

//     if (!totalAmount || totalAmount <= 0) {
//       return res
//         .status(400)
//         .json(new apiError(400, "Total amount must be greater than 0"));
//     }

//     // Fetch employees
//     const employees = await Employee.find({
//       _id: { $in: memberIds },
//       "officialDetails.department": team,
//     });

//     if (employees.length !== memberIds.length) {
//       return res
//         .status(404)
//         .json(new apiError(404, "Some employees not found in the given team"));
//     }

//     // Calculate per-member amount
//     const perMemberAmount = totalAmount / memberIds.length;

//     // Prepare members array
//     const members = memberIds.map((id) => ({
//       employeeId: id,
//       amount: perMemberAmount,
//     }));

//     // Use provided month/year or default to current
//     const now = new Date();
//     const incentiveMonth = month ? Number(month) : now.getMonth() + 1; // Jan = 0
//     const incentiveYear = year ? Number(year) : now.getFullYear();

//     // Save incentive
//     const incentive = await TeamIncentive.create({
//       team,
//       members,
//       totalAmount,
//       createdBy,
//       month: incentiveMonth,
//       year: incentiveYear,
//     });

//     return res
//       .status(201)
//       .json(
//         apiResponseSuccess(
//           incentive,
//           true,
//           statusCode.success,
//           "Incentive distributed successfully!"
//         )
//       );
//   } catch (error) {
//     return res.status(500).json(new apiError(500, error.message));
//   }
// };

const createIncentive = async (req, res) => {
  try {
    const { team, memberIds, totalAmount, month, year } = req.body;
    const createdBy = req.user?._id || req.body.createdBy;

    // Validation
    if (!team || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res
        .status(400)
        .json(new apiError(400, "Team and members are required"));
    }

    if (!totalAmount || totalAmount <= 0) {
      return res
        .status(400)
        .json(new apiError(400, "Total amount must be greater than 0"));
    }

    // Use provided month/year or default to current
    const now = new Date();
    const incentiveMonth = month ? Number(month) : now.getMonth() + 1; // Jan = 0
    const incentiveYear = year ? Number(year) : now.getFullYear();

    // Check for existing incentive for same team, month, year
    const existingIncentive = await TeamIncentive.findOne({
      team,
      month: incentiveMonth,
      year: incentiveYear,
    });

    if (existingIncentive) {
      return res.status(400).json({
        success: false,
        message: `An incentive for ${team} for ${incentiveMonth}/${incentiveYear} already exists.`,
        existingIncentiveId: existingIncentive._id,
      });
    }

    // Fetch employees
    const employees = await Employee.find({
      _id: { $in: memberIds },
      "officialDetails.department": team,
    });

    if (employees.length !== memberIds.length) {
      return res
        .status(404)
        .json(new apiError(404, "Some employees not found in the given team"));
    }

    // Calculate per-member amount
    const perMemberAmount = totalAmount / memberIds.length;

    // Prepare members array
    const members = memberIds.map((id) => ({
      employeeId: id,
      amount: perMemberAmount,
    }));

    // Save incentive
    const incentive = await TeamIncentive.create({
      team,
      members,
      totalAmount,
      createdBy,
      month: incentiveMonth,
      year: incentiveYear,
    });

    return res
      .status(201)
      .json(
        apiResponseSuccess(
          incentive,
          true,
          statusCode.success,
          "Incentive distributed successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getAllIncentives = async (req, res) => {
  try {
    const { team, createdBy, month, year } = req.query;

    const filter = {};

    if (team) filter.team = team;
    if (createdBy) filter.createdBy = createdBy;

    // Month & year filter
    if (month && year) {
      filter.month = Number(month); // ensure number
      filter.year = Number(year);
    } else {
      // Default: current month & year
      const now = new Date();
      filter.month = now.getMonth() + 1;
      filter.year = now.getFullYear();
    }

    const incentives = await TeamIncentive.find(filter)
      .populate("members.employeeId", "firstName lastName email")
      .populate("createdBy", "name email");

    // Always return array, even if empty
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          incentives || [],
          true,
          statusCode.success,
          "Incentives fetched successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getSingleTeamIncentive = async (req, res) => {
  try {
    const { incentiveId } = req.params;

    if (!incentiveId) {
      return res
        .status(400)
        .json(new apiError(400, "Team Incentive ID is required"));
    }

    const incentive = await TeamIncentive.findById(incentiveId)
      .populate("members.employeeId", "firstName lastName email")
      .populate("createdBy", "name email");

    if (!incentive) {
      return res
        .status(404)
        .json(new apiError(404, "Team Incentive not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          incentive,
          true,
          statusCode.success,
          "Team Incentive fetched successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const updateIncentive = async (req, res) => {
  try {
    const { incentiveId } = req.params;
    const { team, memberIds, totalAmount, month, year } = req.body;
    if (!incentiveId) {
      return res
        .status(400)
        .json(new apiError(400, "Incentive ID is required"));
    }

    const updated = await TeamIncentive.findByIdAndUpdate(
      incentiveId,
      { team, memberIds, totalAmount, month, year },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json(new apiError(404, "Incentive not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          updated,
          true,
          statusCode.success,
          "Incentive updated successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const deleteTeamIncentive = async (req, res) => {
  try {
    const { incentiveId } = req.params;

    const incentive = await TeamIncentive.findByIdAndDelete(incentiveId);
    if (!incentive) {
      return res.status(404).json(new apiError(404, "Incentive not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          incentive,
          true,
          statusCode.success,
          "Incentive deleted successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getSingleMemberIncentive = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { month, year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    const now = new Date();
    month = month ? Number(month) : now.getMonth() + 1;
    year = year ? Number(year) : now.getFullYear();

    const incentive = await TeamIncentive.findOne({
      month,
      year,
      "members.employeeId": employeeId,
    }).populate("members.employeeId", "firstName lastName email");

    if (!incentive) {
      return res
        .status(200)
        .json(
          apiResponseSuccess(
            { employeeId, month, year, amount: 0 },
            true,
            statusCode.success,
            "No incentive found for this member, returning 0"
          )
        );
    }

    const member = incentive.members.find(
      (m) => m.employeeId._id.toString() === employeeId.toString()
    );

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          { employeeId, month, year, amount: member ? member.amount : 0 },
          true,
          statusCode.success,
          "Member incentive fetched successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  createIncentive,
  getAllIncentives,
  getSingleTeamIncentive,
  updateIncentive,
  deleteTeamIncentive,
  getSingleMemberIncentive,
};
