import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createIncentive,
  deleteTeamIncentive,
  getAllIncentives,
  getSingleMemberIncentive,
  getSingleTeamIncentive,
  updateIncentive,
} from "../controllers/teamIncentiveController.js";

const router = express.Router();

router.post("/add-team-incentive", verifyJWT(), createIncentive);
router.get("/get-all-incentive", verifyJWT(), getAllIncentives);
router.get("/incentive/:incentiveId", verifyJWT(), getSingleTeamIncentive);
router.get("/single-member-incentive/:employeeId", verifyJWT(), getSingleMemberIncentive);
router.put("/update-incentive/:incentiveId", verifyJWT(), updateIncentive);
router.delete(
  "/delete-incentive/:incentiveId",
  verifyJWT(),
  deleteTeamIncentive
);

export default router;
