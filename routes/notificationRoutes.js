// routes/notificationRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotificationStatus,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/create", verifyJWT(), createNotification);
router.get("/admin/get-all", verifyJWT(), getAllNotifications);
router.get("/:id", verifyJWT(), getNotificationById);
router.patch("/admin/:id", verifyJWT(), updateNotificationStatus);

export default router;
