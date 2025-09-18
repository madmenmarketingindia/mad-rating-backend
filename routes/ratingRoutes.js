import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  getCurrentRating,
  getEmployeeRatings,
  getRatingHistory,
  getSingleMonthRating,
  upsertMonthlyRating,
} from "../controllers/ratingController.js";

const router = express.Router();

router.post("/upsert", verifyJWT(), upsertMonthlyRating);
router.get("/employee/:employeeId/current", verifyJWT(), getCurrentRating);
router.get("/employee-history/:employeeId", verifyJWT(), getRatingHistory);
router.get("/employee-wise", verifyJWT(), getEmployeeRatings);
router.get("/single-month-rating/:employeeId", verifyJWT(), getSingleMonthRating);

export default router;
