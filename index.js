import * as dotenv from "dotenv";
import express from "express";
const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/connectdb.js";
import helmet from "helmet";
dotenv.config({ path: "./.env" });
const PORT = process.env.PORT || 5000;

import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import attendancePayrollRoutes from "./routes/AttendancePayrollRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import dashboard from "./routes/dashboard.js";
import disciplinaryRoutes from "./routes/disciplinaryActionRoutes.js";
import teamIncentiveRoutes from "./routes/teamIncentiveRoutes.js";
import exportDataRoutes from "./routes/exportDataRoutes.js";

import { globalErrorHandler } from "./utils/errorHandler.js";

connectDB();

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(helmet());

// const allowedOrigins = [
//   "https://mad-rating-backend.vercel.app",
//   "http://localhost:3000",
//   "http://localhost:5173",
//   "http://192.168.0.111:5173",
//   "http://172.27.80.1:5173",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         return callback(
//           new Error("CORS policy: This origin is not allowed"),
//           false
//         );
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//   })
// );

app.use(cors({ origin: true, credentials: true }));

app.use(globalErrorHandler);

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/department", departmentRoutes);
app.use("/api/v1/rating", ratingRoutes);
app.use("/api/v1/attendancePayroll", attendancePayrollRoutes);
app.use("/api/v1/salary", salaryRoutes);
app.use("/api/v1/d", dashboard);
app.use("/api/v1/disciplinary", disciplinaryRoutes);
app.use("/api/v1/team", teamIncentiveRoutes);
app.use("/api/v1/export", exportDataRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
