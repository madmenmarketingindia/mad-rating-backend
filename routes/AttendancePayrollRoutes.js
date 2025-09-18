import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  calculateIncentive,
  getPayrollByEmployee,
  listPayrollByEmployees,
  upsertPayroll,
} from "../controllers/AttendancePayrollController.js";

const router = express.Router();

router.post("/upsert", verifyJWT(), upsertPayroll);
router.get("/payroll-list", verifyJWT(), listPayrollByEmployees);
router.get("/payroll/:employeeId", verifyJWT(), getPayrollByEmployee);
router.get("/incentive/:employeeId", verifyJWT(), calculateIncentive);

export default router;
