const SettingsModel = require("../models/Settings");
const authFile = require("../auth.js");

const settings = async (req, res) => {
  const { method, apiKey, userId, ...data } = req.body;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });
  if (!method)
    return res.json({ status: "error", message: "please provide method" });

  let userSettings;

  // GET
  if (method == 1) userSettings = await getSettings({ userId });

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

module.exports = settings;
