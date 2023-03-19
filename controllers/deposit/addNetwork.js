const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinNetworkOption = require("../../models/CoinNetworkOption");
const Network = require("../../models/Network");
var authFile = require("../../auth");

const addNetwork = (req, res) => {

  var result = authFile.apiKeyChecker(req.body.api_key);

  if (result === false) {
    return res.json({ status: "fail", message: "Forbidden 403" });
  }

  const newData = new Network({
    name: req.body.name,
    symbol: req.body.symbol,
    status: 1,
  });

  newData.save().then((data) => {
    res.json({ status: "success", message: "data_added" });
  });
};

module.exports = addNetwork;
