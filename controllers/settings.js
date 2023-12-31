const SettingsModel = require("../models/Settings");
const authFile = require("../auth.js");

const settings = async (req, res) => {
  const { method, apiKey, userId, data } = req.body;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });
  if (!method)
    return res.json({ status: "error", message: "please provide method" });

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

  let userSettings;

  // GET
  if (method == "1") userSettings = await getSettings({ userId });

  // Edit
  if (method == "2") userSettings = await editSettings({ userId, data });

  return res.json({ status: "success", data: userSettings });
};

const getSettings = async ({ userId }) => {
  let userSettings = await SettingsModel.findOne({ userId });
  if (!userSettings) {
    userSettings = new SettingsModel({ userId });
    await userSettings.save();
  }
  return userSettings;
};

const editSettings = async ({ userId, data }) => {
  const userSettings = await SettingsModel.findOneAndUpdate({ userId }, data, {
    new: true,
  }).lean();
  return userSettings;
};

module.exports = settings;
