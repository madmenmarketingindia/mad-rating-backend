import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { apiResponseErr } from "../helper/serverError.js";
import userSchema from "../models/user.model.js";
import { statusCode } from "../helper/statusCodes.js";
import User from "../models/user.model.js";

dotenv.config({ path: "./.env" });

export const verifyJWT = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json(apiResponseErr(null, false, 401, "Unauthorized access"));
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await userSchema.findById(decoded._id);

      if (!user || user.accessToken !== token) {
        return res
          .status(401)
          .json(apiResponseErr(null, false, 401, "Unauthorized user"));
      }

      req.user = user;
      console.log("✅ User authorized, proceeding");
      next();
    } catch (err) {
      console.error("JWT Verification Error:", err.message);
      return res
        .status(401)
        .json(apiResponseErr(null, false, 401, "Token verification failed"));
    }
  };
};

export const verifyAdmin = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json(apiResponseErr(null, false, 401, "Unauthorized access"));
      }

      const token = authHeader.split(" ")[1];
      // Use ACCESS_TOKEN_SECRET, not JWT_SECRET
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Use User model, not userSchema
      const user = await User.findById(decoded._id);

      if (!user || user.accessToken !== token) {
        return res
          .status(401)
          .json(apiResponseErr(null, false, 401, "Unauthorized user"));
      }

      if (user.role !== "admin") {
        return res
          .status(403)
          .json(apiResponseErr(null, false, 403, "Access denied: Admins only"));
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("Admin JWT Verification Error:", err.message);
      return res
        .status(401)
        .json(apiResponseErr(null, false, 401, "Token verification failed"));
    }
  };
};
