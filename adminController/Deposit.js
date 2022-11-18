const DepositModel = require("../models/Deposits");
const authFile = require("../auth.js");
const User = require("../models/User");
const CoinList = require("../models/CoinList");

const userDeposits = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const deposits = await DepositModel.find({ user_id: userId }).lean();

  for (let i = 0; i < deposits.length; i++) {
    let userData = await User.findOne({ _id: deposits[i].user_id });
    deposits[i].user = userData;
  }
  return res.json({ status: "success", data: deposits });
};

const listDeposits = async (req, res) => {
  const apiKey = req.body.apiKey;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const deposits = await DepositModel.find({}).lean();

  for (let i = 0; i < deposits.length; i++) {
    let userData = await User.findOne({ _id: deposits[i].user_id });
    deposits[i].user = userData;
  }

  return res.json({ status: "success", data: deposits });
};

module.exports = { userDeposits, listDeposits };
