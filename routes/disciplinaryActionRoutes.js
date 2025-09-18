// routes/notificationRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createDisciplinaryAction,
  deleteDisciplinaryAction,
  getDisciplinaryActions,
  getEmployeeDisciplinaryActions,
  getSingleDisciplinaryAction,
  getUpcomingReviews,
  updateDisciplinaryAction,
} from "../controllers/disciplinaryActionController.js";

const router = express.Router();

router.post("/create", verifyJWT(), createDisciplinaryAction);
router.get("/get-all", verifyJWT(), getDisciplinaryActions);
router.put("/update/:actionId", verifyJWT(), updateDisciplinaryAction);
router.delete("/delete/:actionId", verifyJWT(), deleteDisciplinaryAction);
router.get("/employee", verifyJWT(), getEmployeeDisciplinaryActions);
router.get("/get-single/:actionId", verifyJWT(), getSingleDisciplinaryAction);
router.get("/upComingReviews", verifyJWT(), getUpcomingReviews);

export default router;
