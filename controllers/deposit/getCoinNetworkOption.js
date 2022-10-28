const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinNetworkOption = require("../../models/CoinNetworkOption");
const Network = require("../../models/Network");
const addCoinNetworkOption = require("./addCoinNetworkOption");

const getCoinNetworkOption = async (req, res) => {
  let coinNetwork = await CoinNetworkOption.find({
    status: 1,
    coin_id: req.body.coin_id,
  });

  let returnArray = [];
  if (coinNetwork.length > 0) {
    for (let i = 0; i < coinNetwork.length; i++) {
      let network = await Network.findOne({
        _id: coinNetwork[i].network_id,
      });

      let networkArray = {
        network_id: coinNetwork[i].network_id,
        network_name: network.name,
        network_symbol: network.symbol,
        image_url: coinNetwork[i].image_url,
      };

      returnArray.push(networkArray);
    }

    res.json({ status: "success", data: returnArray });
  } else {
    res.json({ status: "fail", message: "no_network_found" });
  }
};

module.exports = getCoinNetworkOption;
