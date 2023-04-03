const NotificationsModel = require("../models/Notifications");
const authFile = require("../auth.js");

const getNotification = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const hasRead = req.body.hasRead;

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

  const query = { userId };
  if (hasRead) query.hasRead = hasRead;

  const userNotifications = await NotificationsModel.find(query).lean();
  return res.json({ status: "success", data: userNotifications });
};

module.exports = getNotification;
