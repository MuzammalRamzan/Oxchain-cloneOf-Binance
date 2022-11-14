const UserModel = require("../models/User");
const authFile = require("../auth.js");

const getUser = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const user = await UserModel.findOne({ _id: userId }).lean();
  if (!user) return res.json({ status: "error", message: "user not found" });
  return res.json({ status: "success", data: user });
};

module.exports = getUser;
