const RegisterMailModel = require("../../models/RegisterMail");
const authFile = require("../../auth.js");

const removeEmail = async (req, res) => {
  const apiKey = req.body.apiKey;
  const email = req.body.email;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  await RegisterMailModel.updateOne({ email }, { status: 0 });
  return res.json({ status: "success", message: "Email Removed" });
};

module.exports = removeEmail;
