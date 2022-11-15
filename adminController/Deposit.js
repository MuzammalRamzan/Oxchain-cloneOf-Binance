const DepositModel = require("../models/Deposits");
const authFile = require("../auth.js");

const userDeposits = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const deposits = await DepositModel.find({ user_id: userId }).lean();
  return res.json({ status: "success", data: deposits });
};

module.exports = { userDeposits };
