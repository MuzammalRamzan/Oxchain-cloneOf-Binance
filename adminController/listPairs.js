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

module.exports = listPairs;
