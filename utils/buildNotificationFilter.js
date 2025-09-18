export const buildNotificationFilter = (user) => {
  if (user.role === "admin") return {};

  // normal user → only what they requested
  return { requestedBy: user._id };
};
