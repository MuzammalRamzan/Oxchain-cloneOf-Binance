const WalletModel = require("../models/Wallet");
const authFile = require("../auth.js");
const CoinList = require("../models/CoinList");

const getUserBalance = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const balance = await WalletModel.find({ user_id: userId }).lean();
  return res.json({ status: "success", data: balance });
};

const getWalletBalance = async (req, res) => {
  const apiKey = req.body.apiKey;
  const user_id = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const balance = await WalletModel.find({ user_id: user_id }).lean();

  for (let i = 0; i < balance.length; i++) {
    let coinData = await CoinList.findOne({ _id: balance[i].coin_id });
    balance[i].coin = coinData;
  }
  console.log(balance);

  return res.json({ status: "success", data: balance });
};

const setBalance = async (req, res) => {
  const apiKey = req.body.apiKey;
  const walletId = req.body.walletId;
  const amount = req.body.amount;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  await WalletModel.updateOne({ _id: walletId }, { amount });
  return res.json({ status: "success", message: "Balance Updated" });
};

module.exports = { getUserBalance, setBalance, getWalletBalance };
