const Admin = require("../models/Admin");
const authFile = require("../auth.js");

const editAdmin = async (req, res) => {
  const apiKey = req.body.apiKey;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const adminUsers = await Admin.find().lean();
  return res.json({ status: "success", data: adminUsers });
};

module.exports = editAdmin;
