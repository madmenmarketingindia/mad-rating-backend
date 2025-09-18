import Employee from "../models/employee.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import mongoose from "mongoose";
import Rating from "../models/rating.model.js";
import User from "../models/user.model.js";

const createEmployee = async (req, res) => {
  try {
    const { employeeId, email, phoneNumber, userId } = req.body;

    const existingEmployee = await Employee.findOne({
      $or: [{ email }],
    });

    if (existingEmployee) {
      return res
        .status(409)
        .json(new apiError(409, "Employee already exists with same details"));
    }
    const employee = await Employee.create(req.body);

    await User.findByIdAndUpdate(
      userId,
      { employeeId: employee._id },
      { new: true }
    );
    return res
      .status(201)
      .json(
        apiResponseSuccess(
          employee,
          true,
          statusCode.success,
          "Employee created successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate(
      "userId",
      "username email role"
    );

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          employees,
          true,
          statusCode.success,
          "Employees fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      "userId",
      "username email role"
    );

    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          employee,
          true,
          statusCode.success,
          "Employee found successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          updatedEmployee,
          true,
          statusCode.success,
          "Employee updated successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json(new apiError(400, error.message));
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);

    if (!deletedEmployee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          deletedEmployee,
          true,
          statusCode.success,
          "Employee deleted successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getEmployeeProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // ✅ Validate input
    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json(new apiError(400, "Invalid Employee ID"));
    }

    // ✅ Fetch Employee
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    // ✅ Fetch latest rating
    const latestRating = await Rating.findOne({ employeeId })
      .sort({ year: -1, month: -1 })
      .lean();

    let ratingData = {};
    if (latestRating) {
      ratingData = {
        month: latestRating.month,
        year: latestRating.year,
        categories: latestRating.categories,
        averageScore: latestRating.averageScore,
      };
    }

    // ✅ Prepare response
    const responseData = {
      employeeId: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      residentialAddress: employee.residentialAddress,
      permanentAddress: employee.permanentAddress,
      officialDetails: employee.officialDetails,
      bankDetails: employee.bankDetails,
      salary: employee.salary,
      employmentStatus: employee.employmentStatus,
      emergencyContact: employee.emergencyContact,
      latestRating: ratingData,
    };

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          responseData,
          true,
          statusCode.success,
          "Employee profile fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getEmployeeProfileById:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeProfile,
};
