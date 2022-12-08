const AdminSettingsModel = require("../models/AdminSettings");
const authFile = require("../auth.js");

const getAdminSettings = async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const adminSettings = await AdminSettingsModel.findOne().lean();
  return res.json({ status: "success", data: adminSettings });
};

module.exports = getAdminSettings;
