const Admin = require("../models/Admin");
const authFile = require("../auth.js");
const utilities = require("../utilities.js");

const editAdmin = async (req, res) => {
  const apiKey = req.body.apiKey;
  const adminId = req.body.adminId;
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const data = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = utilities.hashData(password);
  if (phone) data.phone = phone;

  await Admin.updateOne({ _id: adminId }, data);
  return res.json({ status: "success", message: "Admin updated" });
};

module.exports = editAdmin;
