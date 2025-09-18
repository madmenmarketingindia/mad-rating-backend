import * as dotenv from "dotenv";
import User from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError(404, "User not found");
    }

    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "365d",
    });

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    user.accessToken = accessToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generateAccessTokenAndRefreshToken:", error);
    throw new apiError(
      500,
      "something went wrong while generating access and refresh token"
    );
  }
};

// *-----login controller ----*
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received:", { email, password });

  if (!email) {
    throw new apiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new apiError(400, "User is not Registered");
  }

  if (!user.isActive) {
    throw new apiError(
      403,
      "Your account is inactive. Please contact support."
    );
  }

  // const isPasswordValid = await user.isPasswordCorrect(password);
  const isPasswordValid = user.password === password;

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid user credentials");
  }

  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: false,
    secure: true, // must be true in production (HTTPS)
    sameSite: true ? "None" : "Lax", // None for cross-site in prod, Lax in dev
    maxAge: 60 * 60 * 24 * 365,
    path: "/", // cookie path
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("userName", loggedUser.username, cookieOptions)
    .cookie("userRole", loggedUser.role, cookieOptions)
    .json(
      apiResponseSuccess(
        {
          user: loggedUser,
          // accessToken,
          // refreshToken,
        },
        true,
        statusCode.success,
        "User logged In successfully!"
      )
    );
};

const createUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json(new apiError(400, "Missing required fields"));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json(new apiError(409, "Email already registered"));
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    return res
      .status(201)
      .json(
        apiResponseSuccess(
          user,
          true,
          statusCode.success,
          "User created successfully!"
        )
      );
  } catch (error) {
    res.status(500).json(new apiError(500, error.message));
  }
};

// Read All Users
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res
      .status(200)
      .json(
        apiResponseSuccess(users, true, 200, "Users fetched successfully!")
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

// Read One User
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("");

    if (!user) {
      return res.status(404).json(new apiError(404, "User not found"));
    }

    return res
      .status(200)
      .json(apiResponseSuccess(user, true, 200, "User found"));
  } catch (error) {
    return res.status(500).json(new apiError(500, "Failed to fetch user"));
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json(new apiError(404, "User not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(updatedUser, true, 200, "User updated successfully!")
      );
  } catch (error) {
    return res.status(400).json(new apiError(400, error.message));
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json(new apiError(404, "User not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(deletedUser, true, 200, "User deleted successfully!")
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const toggleUserActiveStatus = async (req, res) => {
  try {
    const { userId, isActive } = req.body;

    if (!userId) {
      return res.status(400).json(new apiError(400, "userId is required"));
    }

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json(new apiError(400, "isActive must be a boolean value"));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json(new apiError(404, "User not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          updatedUser,
          true,
          200,
          `User has been ${
            isActive ? "activated" : "deactivated"
          } successfully!`
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  loginUser,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActiveStatus,
};
