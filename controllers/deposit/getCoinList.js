const CoinList = require("../../models/CoinList");
const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinNetworkOption = require("../../models/CoinNetworkOption");
const Network = require("../../models/Network");

const getCoinList = (req, res) => {
  CoinList.find({ status: 1 }).then((coins) => {
    res.json({ status: "success", data: coins });
  });
};

module.exports = getCoinList;
