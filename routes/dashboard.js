import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  getBirthdaysByMonth,
  getDepartmentRatings,
  getDepartmentStats,
  getEmployeeMonthlyRating,
  getEmployeeYearlyRatings,
  getWorkAnniversariesByMonth,
} from "../controllers/dashboard.js";

const router = express.Router();

router.get("/department-stats", verifyJWT(), getDepartmentStats);
router.get("/department-rating", verifyJWT(), getDepartmentRatings);
router.get("/birthdays", verifyJWT(), getBirthdaysByMonth);
router.get("/workAnniversary", verifyJWT(), getWorkAnniversariesByMonth);
router.get("/employee", verifyJWT(), getEmployeeMonthlyRating);
router.get("/employee-yearly-ratings", verifyJWT(), getEmployeeYearlyRatings);

export default router;
