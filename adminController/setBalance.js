const WalletModel = require("../models/Wallet");
const authFile = require("../auth.js");

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

module.exports = setBalance;
