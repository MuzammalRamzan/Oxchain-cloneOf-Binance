const UserModel = require("../../models/User");
const authFile = require("../../auth.js");

const deleteAccount = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const reason = req.body.reason;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);

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

  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  await UserModel.updateOne({ _id: userId }, { deleted: true, reason });
  return res.json({ status: "success", message: "Account Deleted" });
};

module.exports = deleteAccount;
