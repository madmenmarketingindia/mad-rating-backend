import express from "express";

import { verifyJWT } from "../middlewares/auth.js";
import { createFNFSettlement } from "../controllers/FNFSettlementController.js";

const router = express.Router();

router.post("/upsert", verifyJWT(), createFNFSettlement);

export default router;
