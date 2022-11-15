const PairsModel = require("../models/Pairs");
const authFile = require("../auth.js");

const listPairs = async (req, res) => {
  const apiKey = req.body.apiKey;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const pairs = await PairsModel.find().lean();
  return res.json({ status: "success", data: pairs });
};

const setPairFee = async (req, res) => {
  const apiKey = req.body.apiKey;
  const pairId = req.body.pairId;
  const tradeFee = req.body.tradeFee;
  const withdrawFee = req.body.withdrawFee;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const data = {};
  if (tradeFee) data.tradeFee = tradeFee;
  if (withdrawFee) data.withdrawFee = withdrawFee;

  await PairsModel.updateOne({ _id: pairId }, data);
  return res.json({ status: "success", message: "Fee Added" });
};

module.exports = { listPairs, setPairFee };
