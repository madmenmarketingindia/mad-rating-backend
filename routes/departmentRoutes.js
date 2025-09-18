import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from "../controllers/departmentController.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create", verifyJWT(), createDepartment);
router.get("/get-all", verifyJWT(), getDepartments);
router.get("/:id", verifyJWT(), getDepartmentById);
router.put("/:id", verifyJWT(), updateDepartment);
router.delete("/:id", verifyJWT(), deleteDepartment);

export default router;
