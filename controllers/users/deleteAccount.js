const UserModel = require("../../models/User");
const authFile = require("../../auth.js");

const deleteAccount = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const reason = req.body.reason;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  await UserModel.updateOne({ _id: userId }, { deleted: true, reason });
  return res.json({ status: "success", message: "Account Deleted" });
};

module.exports = deleteAccount;
