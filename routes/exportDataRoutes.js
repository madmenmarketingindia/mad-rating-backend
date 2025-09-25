import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  exportEmployees,
  exportPayrollExcel,
} from "../controllers/exportDataController.js";

const router = express.Router();

router.get("/employees", exportEmployees);
router.get("/employees-payroll", exportPayrollExcel);

export default router;
