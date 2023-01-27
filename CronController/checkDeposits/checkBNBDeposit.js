const axios = require("axios");
const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const CoinList = require("../../models/CoinList");
const ContractAddressSchema = require("../../models/ContractAddress");
const Deposits = require("../../models/Deposits");
var authFile = require("../../auth.js");
const utilities = require("../../utilities");
require("dotenv").config();
var bscKey = process.env.BSC_API_KEY;

const checkBNBDeposit = async () => {
  try {
    let networkID = "6359169ee5f78e20c0bb809a";
    const coinID = "62fb45483f8c1ffba43e4813";
    let wallets = await WalletAddress.find({ network_id: networkID });
    for (var i = 0; i < wallets.length; i++) {
      let wallet = wallets[i];

      let url = "https://api.bscscan.com/api?module=account&action=txlist&address=" + wallet.wallet_address + "&endblock=latest&apikey=" + bscKey;

      let checkRequest = await axios.get(
        url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
      }
      );
      var amount = "";
      var user = "";
      var tx_id = "";
      var deposit = "";

      if (checkRequest.data.message == "OK") {

        for (let j = 0; j < checkRequest.data.result.length; j++) {
          if (checkRequest.data.result[j].to.toLowerCase() != wallet.wallet_address.toLowerCase()) continue;
          amount = checkRequest.data.result[j].value / 1000000000000000000;
          user = await User.findOne({ _id: wallet.user_id }).exec();
          deposit = await Deposits.findOne({
            tx_id: checkRequest.data.result[j].hash,
          }).exec();

          if (deposit === null) {
            utilities.addDeposit(
              wallet.user_id,
              "BNB",
              amount,
              wallet.wallet_address,
              checkRequest.data.result[j].hash,
              "62fb45483f8c1ffba43e4813",
              networkID,
              checkRequest.data.result[j].from
            );

          } else {
          }
        }
      }

    }
  } catch (err) {
    console.log("BNB Deposit err : ", err.message);
  }
}

module.exports = checkBNBDeposit;