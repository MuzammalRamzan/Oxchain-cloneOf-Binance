const AdminModel = require("../models/Admin");
const authFile = require("../auth.js");

const getAdmin = async (req, res) => {
  const apiKey = req.body.apiKey;
  const adminId = req.body.adminId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const admin = await AdminModel.findOne({ _id: adminId }).lean();
  if (!admin) return res.json({ status: "error", message: "admin not found" });
  return res.json({ status: "success", data: admin });
};

module.exports = getAdmin;
