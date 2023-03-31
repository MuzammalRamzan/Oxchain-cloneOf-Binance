const NotificationsModel = require("../models/UserNotifications");
const authFile = require("../auth.js");

const clearNotifications = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });


  let key = req.headers["key"];

  if (!key) {
    return res.json({ status: "fail", message: "key_not_found" });
  }

  if (!req.body.device_id || !req.body.userId) {
    return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
  }

  let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.userId);


  if (checkKey === "expired") {
    return res.json({ status: "fail", message: "key_expired" });
  }

  if (!checkKey) {
    return res.json({ status: "fail", message: "invalid_key" });
  }


  if (!userId)
    return res.json({
      status: "error",
      message: "Please provide user id",
    });

  await NotificationsModel.deleteMany({ user_id: userId });
  return res.json({ status: "success", message: "cleared all user notifications!" });
};

module.exports = clearNotifications;
