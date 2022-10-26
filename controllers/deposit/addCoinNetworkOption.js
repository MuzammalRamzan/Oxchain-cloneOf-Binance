const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinNetworkOption = require("../../models/CoinNetworkOption");
const Network = require("../../models/Network");

const addCoinNetworkOption = (req, res) => {
  const newData = new CoinNetworkOption({
    coin_id: req.body.coin_id,
    network_id: req.body.network_id,
    image_url: req.body.image_url,
    status: 1,
  });

  newData.save().then((data) => {
    res.json({ status: "success", message: "data_added" });
  });
};

module.exports = addCoinNetworkOption;
