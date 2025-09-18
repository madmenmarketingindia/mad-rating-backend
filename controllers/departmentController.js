import Department from "../models/department.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Department.findOne({ name });
    if (existing) {
      return res
        .status(409)
        .json(new apiError(409, "Department already exists"));
    }
    const department = await Department.create(req.body);
    return res
      .status(201)
      .json(
        apiResponseSuccess(
          department,
          true,
          statusCode.success,
          "Department created successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

// Get All Departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          departments,
          true,
          statusCode.success,
          "Departments fetched successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

// Get Department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json(new apiError(404, "Department not found"));
    }
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          department,
          true,
          statusCode.success,
          "Department found"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updated) {
      return res.status(404).json(new apiError(404, "Department not found"));
    }
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          updated,
          true,
          statusCode.success,
          "Department updated successfully!"
        )
      );
  } catch (error) {
    return res.status(400).json(new apiError(400, error.message));
  }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json(new apiError(404, "Department not found"));
    }
    return res
      .status(200)
      .json(
        apiResponseSuccess(
          deleted,
          true,
          statusCode.success,
          "Department deleted successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};
