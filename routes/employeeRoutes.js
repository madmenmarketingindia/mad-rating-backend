import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployeeProfile,
  getEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/employee-profile/:employeeId", verifyJWT(), getEmployeeProfile);
router.post("/create", verifyJWT(), createEmployee);
router.get("/get-all", verifyJWT(), getEmployees);
router.get("/:id", verifyJWT(), getEmployeeById);
router.put("/:id", verifyJWT(), updateEmployee);
router.delete("/:id", verifyJWT(), deleteEmployee);

export default router;
