const WithdrawModel = require("../models/Withdraw");
const authFile = require("../auth.js");

const userWithdraws = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const withdraws = await WithdrawModel.find({ user_id: userId }).lean();
  return res.json({ status: "success", data: withdraws });
};

module.exports = { userWithdraws };
