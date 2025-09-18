import { apiResponseSuccess } from "../helper/serverError.js";
import { apiError } from "../utils/apiError.js";
import Notification from "../models/notification.model.js";
import { statusCode } from "../helper/statusCodes.js";
import { buildNotificationFilter } from "../utils/buildNotificationFilter.js";

const createNotification = async (req, res) => {
  try {
    const { campaignId, influencerIds, action } = req.body;
    const userId = req.user._id;
    const notification = await Notification.create({
      campaign: campaignId,
      influencers: influencerIds,
      action,
      requestedBy: userId,
    });

    return res
      .status(201)
      .json(
        apiResponseSuccess(
          notification,
          true,
          statusCode.success,
          "Notification created successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getAllNotifications = async (req, res) => {
  try {
    /* 🗝️  build filter once */
    const filter = buildNotificationFilter(req.user);

    /* 🏎️  lean() = plain JS objects (quicker & lighter) */
    const notifications = await Notification.find(filter)
      .populate("campaign", "name")
      .populate("requestedBy", "fullName email")
      .populate("influencers", "_id")
      .populate("reviewedBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          notifications,
          true,
          statusCode.success,
          "Notifications fetched successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id)
      .populate("campaign", "name description platform")
      .populate("requestedBy", "fullName email")
      .populate("influencers")
      .populate("reviewedBy", "fullName email");

    if (!notification) {
      return res.status(404).json(new apiError(404, "Notification not found"));
    }

    if (!notification.seenBy.some((u) => u.equals(req.user._id))) {
      notification.seenBy.push(req.user._id);
      await notification.save();
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          notification,
          true,
          statusCode.success,
          "Notification fetched successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

const updateNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json(new apiError(400, "Invalid status value"));
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate("campaign", "name platform")
      .populate("requestedBy", "fullName email")
      .populate("influencers", "name igLink")
      .populate("reviewedBy", "fullName email");

    if (!notification) {
      return res.status(404).json(new apiError(404, "Notification not found"));
    }

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          notification,
          true,
          statusCode.success,
          "Notification updated successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotificationStatus,
};
