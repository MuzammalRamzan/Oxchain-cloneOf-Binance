const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinNetworkOption = require("../../models/CoinNetworkOption");
const Network = require("../../models/Network");

const getCoinNetworkOption = (req, res) => {
  CoinNetworkOption.find({ status: 1, coin_id: req.body.coin_id }).then(
    (networks) => {
      res.json({ status: "success", data: networks });
    }
  );
};

module.exports = getCoinNetworkOption;
