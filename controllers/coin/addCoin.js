const CoinList = require("../../models/CoinList");
var authFile = require("../../auth.js");

const addCoin = async (req, res) => {
  
  var api_key_result = req.body.api_key;

  const newCoin = new CoinList({
    name: req.body.name,
    symbol: req.body.symbol,
    network: req.body.network,
    contract_address: req.body.contract_address,
    image_url: req.body.image_url,
  });

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    newCoin.save();
    res.json({ status: "success", data: result });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = addCoin;
