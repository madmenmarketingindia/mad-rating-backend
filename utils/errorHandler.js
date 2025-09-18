import { apiError } from "./apiError.js";


export const globalErrorHandler = (err, req, res, next) => {
  if (err instanceof apiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // fallback for unexpected errors
  return res.status(500).json({
    statusCode: 500,
    message: err.message || "Internal Server Error",
    success: false,
    errors: [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
