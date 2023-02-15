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
var ethKey = process.env.ETH_API_KEY;

const checkERCContractDeposit = async () => {
  try {
    let networkId = "6358f354733321c968f40f6b";
    let wallet = await WalletAddress.find({

      network_id: networkId,
    }).exec();
    for (let i = 0; i < wallet.length; i++) {
      let address = wallet[i].wallet_address;
      if (address == null) continue;
      let user_id = wallet[i].user_id;
      let url = "https://api.etherscan.io/api?module=account&action=tokentx&address=" + address + "&endblock=latest&apikey=" + ethKey;
      //let url = "https://api.etherscan.io/api?module=account&action=tokentx&address=0xA484D878E8FA056D694fAFC0B8e15c28F5D97853&endblock=latest&apikey=" + ethKey;
      let checkRequest = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
      });

      var amount = "";
      var user = "";
      var tx_id = "";
      var deposit = "";

      if (checkRequest.data.message === "OK") {

        for (let j = 0; j < checkRequest.data.result.length; j++) {
          let item = checkRequest.data.result[j];

          if (item.to.toUpperCase() != address.toUpperCase()) continue;
          user = await User.findOne({ _id: user_id }).exec();
          deposit = await Deposits.findOne({
            tx_id: checkRequest.data.result[j].hash,
          }).exec();

          if (deposit === null) {
            let digitNumber = parseInt(item.tokenDecimal);
            let numbers = "1";
            for (let u = 0; u < digitNumber; u++) {
              numbers += "0";
            }
            let digit = parseInt(numbers);
            amount = parseFloat(item.value) / parseFloat(digit);

            let getCoinInfo = await CoinList.findOne({ symbol: item.tokenSymbol });

            if (getCoinInfo == null) continue;
            utilities.addDeposit(
              user_id,
              getCoinInfo.symbol,
              amount,
              address,
              item.hash,
              getCoinInfo._id,
              networkId
            );

          }
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
}
module.exports = checkERCContractDeposit;