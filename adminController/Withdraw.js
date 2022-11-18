const WithdrawModel = require("../models/Withdraw");
const authFile = require("../auth.js");
const User = require("../models/User");
const CoinList = require("../models/CoinList");

const userWithdraws = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const withdraws = await WithdrawModel.find({ user_id: userId }).lean();

  for (let i = 0; i < withdraws.length; i++) {
    let userData = await User.findOne({ _id: withdraws[i].user_id });
    withdraws[i].user = userData;

    let coinData = await CoinList.findOne({ _id: withdraws[i].coin_id });
    withdraws[i].coin = coinData;
  }

  return res.json({ status: "success", data: withdraws });
};

const listWithdraws = async (req, res) => {
  const apiKey = req.body.apiKey;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const withdraws = await WithdrawModel.find({}).lean();

  for (let i = 0; i < withdraws.length; i++) {
    let userData = await User.findOne({ _id: withdraws[i].user_id });
    withdraws[i].user = userData;

    let coinData = await CoinList.findOne({ _id: withdraws[i].coin_id });
    withdraws[i].coin = coinData;
  }

  return res.json({ status: "success", data: withdraws });
};
module.exports = { userWithdraws, listWithdraws };
