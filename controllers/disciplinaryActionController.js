import DisciplinaryAction from "../models/DisciplinaryAction.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Employee from "../models/employee.model.js";

const createDisciplinaryAction = async (req, res) => {
  try {
    const { employeeId, type, reason, issuedBy, reviewPeriodDays } = req.body;

    // 1. Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    // 2. Create the disciplinary action
    const disciplinaryAction = await DisciplinaryAction.create({
      employeeId: employee._id,
      type,
      reason,
      issuedBy: req.user._id,
      reviewPeriodDays,
    });

    return res
      .status(201)
      .json(
        apiResponseSuccess(
          disciplinaryAction,
          true,
          statusCode.success,
          "Disciplinary Action created successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getDisciplinaryActions = async (req, res) => {
  try {
    const { status, type, issuedBy, department } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status; // Active, Review, Resolved
    if (type) filter.type = type; // Warning, Suspension, Termination Notice
    if (issuedBy) filter.issuedBy = issuedBy; // userId of HR/Admin

    // If department filter is needed, we need to join Employee
    let actionsQuery = DisciplinaryAction.find(filter).populate(
      "issuedBy",
      "username email role"
    );

    if (department) {
      // Populate employee info and filter by department
      actionsQuery = actionsQuery.populate({
        path: "employeeId",
        select: "firstName lastName officialDetails.department",
        match: { "officialDetails.department": department },
      });
    } else {
      actionsQuery = actionsQuery.populate(
        "employeeId",
        "firstName lastName officialDetails.department"
      );
    }

    const actions = await actionsQuery.exec();

    // Remove nulls if department filter removed unmatched employees
    const filteredActions = actions.filter((a) => a.employeeId !== null);

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          filteredActions,
          true,
          statusCode.success,
          "Disciplinary Actions fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getDisciplinaryActions:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const updateDisciplinaryAction = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { type, reason, status, reviewPeriodDays } = req.body;

    // ✅ Find the action
    const action = await DisciplinaryAction.findById(actionId);
    if (!action) {
      return res
        .status(404)
        .json(new apiError(404, "Disciplinary Action not found"));
    }

    // ✅ Update fields if provided
    if (type) action.type = type;
    if (reason) action.reason = reason;
    if (status) action.status = status;
    if (reviewPeriodDays) {
      action.reviewPeriodDays = reviewPeriodDays;
      // Optionally update reviewEndDate based on days
      action.reviewEndDate = new Date(
        Date.now() + reviewPeriodDays * 24 * 60 * 60 * 1000
      );
    }

    await action.save();

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          action,
          true,
          statusCode.success,
          "Disciplinary Action updated successfully!"
        )
      );
  } catch (error) {
    console.error("Error in updateDisciplinaryAction:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const deleteDisciplinaryAction = async (req, res) => {
  try {
    const { actionId } = req.params;

    // ✅ Find the action
    const action = await DisciplinaryAction.findById(actionId);
    if (!action) {
      return res
        .status(404)
        .json(new apiError(404, "Disciplinary Action not found"));
    }

    // ✅ Delete
    await action.deleteOne();

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          null,
          true,
          statusCode.success,
          "Disciplinary Action deleted successfully!"
        )
      );
  } catch (error) {
    console.error("Error in deleteDisciplinaryAction:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getEmployeeDisciplinaryActions = async (req, res) => {
  try {
    const userId = req.user?._id; // assume JWT middleware sets req.user
    if (!userId) {
      return res.status(401).json(new apiError(401, "Unauthorized"));
    }

    // 1. Find employee by userId
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    // 2. Build filter
    const filter = { employeeId: employee._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    // 3. Fetch actions
    const actions = await DisciplinaryAction.find(filter)
      .populate("issuedBy", "firstName lastName email") // get issuer info
      .sort({ date: -1 }); // latest first

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          actions,
          true,
          statusCode.success,
          "Disciplinary actions fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error fetching employee disciplinary actions:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getSingleDisciplinaryAction = async (req, res) => {
  try {
    const { actionId } = req.params;

    const action = await DisciplinaryAction.findById(actionId)
      .populate("issuedBy", "username email role")
      .populate("employeeId", "firstName lastName officialDetails.department");

    if (!action) {
      return res
        .status(404)
        .json(new apiError(404, "Disciplinary Action not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          action,
          true,
          statusCode.success,
          "Single Disciplinary Action fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getSingleDisciplinaryAction:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getUpcomingReviews = async (req, res) => {
  try {
    const today = new Date();

    // Fetch all actions currently in Review status
    const reviewPeriodActions = await DisciplinaryAction.find({
      status: "Review",
    })
      .populate("employeeId", "firstName lastName officialDetails.department")
      .populate("issuedBy", "username email role")
      .sort({ date: 1 });

    // Map and calculate daysLeft for each action
    const actionsWithDaysLeft = reviewPeriodActions.map((action) => {
      let daysLeft = "N/A";
      let endDate = action.reviewEndDate;

      // If reviewEndDate not set but reviewPeriodDays exists, calculate it
      if (!endDate && action.reviewPeriodDays && action.reviewPeriodDays > 0) {
        endDate = new Date(
          action.date.getTime() + action.reviewPeriodDays * 24 * 60 * 60 * 1000
        );
      }

      // Calculate days left if endDate exists
      if (endDate) {
        const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) daysLeft = "Expired";
        else if (diff === 0) daysLeft = "Today";
        else daysLeft = `${diff} day${diff > 1 ? "s" : ""} left`;
      }

      return {
        ...action.toObject(),
        daysLeft,
      };
    });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          actionsWithDaysLeft,
          true,
          statusCode.success,
          "All disciplinary actions in review period fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getUpcomingReviews:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  createDisciplinaryAction,
  getDisciplinaryActions,
  updateDisciplinaryAction,
  deleteDisciplinaryAction,
  getEmployeeDisciplinaryActions,
  getSingleDisciplinaryAction,
  getUpcomingReviews,
};
