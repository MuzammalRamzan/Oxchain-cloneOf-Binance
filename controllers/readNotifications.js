const NotificationsModel = require("../models/Notifications");
const authFile = require("../auth.js");

const readNotifications = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });
  if (!userId) return res.json({ status: "error", message: "User Id is null" });

  await NotificationsModel.updateMany(
    { userId, hasRead: false },
    { hasRead: true }
  );
  return res.json({ status: "success", message: "marked as read!" });
};

module.exports = readNotifications;
