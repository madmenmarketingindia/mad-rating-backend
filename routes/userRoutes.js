import express from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  loginUser,
  toggleUserActiveStatus,
  updateUser,
} from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/create", createUser);
router.get("/get-all", verifyJWT(), getUsers);
router.get("/:id", verifyJWT(), getUserById);
router.put("/:id", verifyJWT(), updateUser);
router.delete("/:id", verifyJWT(), deleteUser);
router.patch("/active", verifyJWT(), toggleUserActiveStatus);

export default router;
