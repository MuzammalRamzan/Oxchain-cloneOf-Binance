const RegisteredAddressModel = require("../../models/RegisteredAddress");
const authFile = require("../../auth.js");

const getRegisteredAddresses = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const coinId = req.body.coinId;
  const whiteList = req.body.whiteList;
  const type = req.body.type;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const query = { user_id: userId };
  if (coinId) query.coin_id = coinId;
  if (whiteList) query.whiteList = whiteList;
  if (type) query.type = type;

  const addresses = await RegisteredAddressModel.find(query).lean();
  return res.json({ status: "success", data: addresses });
};

module.exports = getRegisteredAddresses;
