import express from "express";
import {
  createHoliday,
  deleteHoliday,
  getHolidayById,
  getHolidays,
  getHolidaysByMonth,
  updateHoliday,
} from "../controllers/holidayController.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create", verifyJWT(), createHoliday);
router.get("/get-all", verifyJWT(), getHolidays);
router.get("/get-one/:id", verifyJWT(), getHolidayById);
router.put("/update/:id", verifyJWT(), updateHoliday);
router.delete("/delete/:id", verifyJWT(), deleteHoliday);
router.get("/month", verifyJWT(), getHolidaysByMonth);

export default router;

