const NotificationsModel = require("../models/Notifications");
const authFile = require("../auth.js");

const readNotifications = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const notificationId = req.body.notificationId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  if (!userId && !notificationId)
    return res.json({
      status: "error",
      message: "Please provide user id or notification id",
    });

  const query = { hasRead: false };
  if (userId) query.userId = userId;
  if (notificationId) query._id = notificationId;

  await NotificationsModel.updateMany(query, { hasRead: true });
  return res.json({ status: "success", message: "marked as read!" });
};

module.exports = readNotifications;
