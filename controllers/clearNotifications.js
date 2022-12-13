const NotificationsModel = require("../models/Notifications");
const authFile = require("../auth.js");

const clearNotifications = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  if (!userId)
    return res.json({
      status: "error",
      message: "Please provide user id",
    });

  await NotificationsModel.deleteMany({ userId });
  return res.json({ status: "success", message: "cleared all user notifications!" });
};

module.exports = clearNotifications;
