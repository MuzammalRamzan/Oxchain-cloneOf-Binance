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

  let key = req.headers["key"];

  if (!key) {
    return res.json({ status: "fail", message: "key_not_found" });
  }

  if (!req.body.device_id || !req.body.userId) {
    return res.json({ status: "fail", message: "invalid_params" });
  }

  let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.userId);


  if (checkKey === "expired") {
    return res.json({ status: "fail", message: "key_expired" });
  }

  if (!checkKey) {
    return res.json({ status: "fail", message: "invalid_key" });
  }

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
