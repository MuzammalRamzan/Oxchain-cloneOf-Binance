const CoinList = require("../../models/CoinList");
const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinNetworkOption = require("../../models/CoinNetworkOption");
const Network = require("../../models/Network");

const getWalletAddress = (req, res) => {
  WalletAddress.find({
    status: 1,
    user_id: req.body.user_id,
    network_id: req.body.network_id,
  }).then((coins) => {
    res.json({ status: "success", data: coins });
  });
};

module.exports = getWalletAddress;
