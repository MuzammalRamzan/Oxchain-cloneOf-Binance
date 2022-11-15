const authFile = require("../auth.js");
const BonusTypes = require("../models/BonusTypes");

const setBonusRate = async (req, res) => {
  const apiKey = req.body.apiKey;
  const bonusTypeId = req.body.bonusTypeId;
  const amount = req.body.amount;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  await BonusTypes.updateOne({ _id: bonusTypeId }, { amount });
  return res.json({ status: "success", message: "Fee Added" });
};

module.exports = { setBonusRate };
