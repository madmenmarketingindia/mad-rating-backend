import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createEmployee,
  deleteEmployee,
  getAllDepartments,
  getEmployeeById,
  getEmployeeProfile,
  getEmployees,
  getEmployeesByDepartment,
  updateEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/employee-profile/:employeeId", verifyJWT(), getEmployeeProfile);
router.post("/create", verifyJWT(), createEmployee);
router.get("/get-all", verifyJWT(), getEmployees);
router.get("/by-department", verifyJWT(), getEmployeesByDepartment);
router.get("/all-department", verifyJWT(), getAllDepartments);

router.get("/:id", verifyJWT(), getEmployeeById);
router.put("/:id", verifyJWT(), updateEmployee);
router.delete("/:id", verifyJWT(), deleteEmployee);

export default router;
