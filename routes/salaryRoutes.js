import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  getSalaryByEmployeeAndYear,
  getSalaryDetailsByEmployeeMonthYear,
} from "../controllers/salaryController.js";

const router = express.Router();

router.get("/list/:employeeId", verifyJWT(), getSalaryByEmployeeAndYear);
router.get(
  "/employee/:employeeId",
  verifyJWT(),
  getSalaryDetailsByEmployeeMonthYear
);

export default router;
