const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinNetworkOption = require("../../models/CoinNetworkOption");
const Network = require("../../models/Network");

const addNetwork = (req, res) => {
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
