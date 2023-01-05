const axios = require("axios");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletAddress = require("../models/WalletAddress");
const CoinList = require("../models/CoinList");
const ContractAddressSchema = require("../models/ContractAddress");
const Deposits = require("../models/Deposits");
var authFile = require("../auth.js");

const utilities = require("../utilities");
require("dotenv").config();
var ethKey = process.env.ETH_API_KEY;

const checkETHDeposit = async() => {
    let networkId = "6358f354733321c968f40f6b";
  let wallet = await WalletAddress.find({

    network_id: networkId,
  }).exec();

  for (let i = 0; i < wallet.length; i++) {
    let address = wallet[i].wallet_address;

    if (address == null) continue;
    let user_id = wallet[i].user_id;
    if (address.length > 0) {
      let url = "https://api.etherscan.io/api?module=account&action=txlist&address=" + address + "&endblock=latest&apikey=" + ethKey;
      let checkRequest = await axios.get(url);

      var amount = "";
      var user = "";
      var tx_id = "";
      var deposit = "";

      if (checkRequest.data.message === "OK") {

        for (let j = 0; j < checkRequest.data.result.length; j++) {
          if(checkRequest.data.result[j].to.toLowerCase() != address.toLowerCase()) continue;
          amount = checkRequest.data.result[j].value / 1000000000000000000;
          user = await User.findOne({ _id: user_id }).exec();
          deposit = await Deposits.findOne({
            user_id: user_id,
            tx_id: checkRequest.data.result[j].hash,
          }).exec();

          if (deposit === null) {

            utilities.addDeposit(
              user_id,
              "ETH",
              amount,
              address,
              checkRequest.data.result[j].hash,
              "62bc116eb65b02b777c97b3d",
              networkId
            );
          } else {
          }
        }
      }
    }
  }

}

module.exports = checkETHDeposit;