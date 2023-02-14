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
const checkBTCDeposit = async() => {
    let networkId = "635916ade5f78e20c0bb809c";

    let wallet = await WalletAddress.find({
        network_id: networkId,
      }).exec();
  
      for (let i = 0; i < wallet.length; i++) {
        let address = wallet[i].wallet_address;
        let user_id = wallet[i].user_id;
        if (address == null) continue;
        if (address.length > 0) {
          let checkRequest = await axios.request({
            method: "post",
            url: "http://"+process.env.BTCSEQHOST,
            data: "request=transactions&address=" + address,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
  
          var amount = "";
          var user = "";
          var tx_id = "";
          var deposit = "";
          if(checkRequest.data.status == 'error') continue;
          for (let j = 0; j < checkRequest.data.data.length; j++) {
            amount = checkRequest.data.data[j].value / 100000000;
            user = await User.findOne({ _id: user_id }).exec();
            deposit = await Deposits.findOne({
              user_id: user_id,
              tx_id: checkRequest.data.data[j].tx_hash,
            }).exec();
  
            if (deposit === null) {
              utilities.addDeposit(
                user_id,
                "BTC",
                amount,
                address,
                checkRequest.data.data[j].tx_hash,
                "62aaf66c419ff12e16168c8e",
                networkId
              );

            } else {
            }
          }
        }
      }
}
module.exports = checkBTCDeposit;