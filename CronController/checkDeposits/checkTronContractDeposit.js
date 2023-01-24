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
const checkTronContractDeposit = async() => {
 try {
  let networkId = "6358f17cbc20445270757291";
  let wallet = await WalletAddress.find({
    network_id: networkId,
  }).exec();

  let tx_id = "";
  let user_id = "";
  let amount = "";
  let address = "";
  let deposit = "";

  for (let i = 0; i < wallet.length; i++) {
    let address = wallet[i].wallet_address;

    let user_id = wallet[i].user_id;
    if (address.length > 1) {

      let checkRequest = await axios.get("https://api.trongrid.io/v1/accounts/" +address +"/transactions/trc20?limit=30", {
        headers : {
          "User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
      });

      for (let j = 0; j < checkRequest.data.data.length; j++) {
        let item = checkRequest.data.data[j];
        if(item.to.toLowerCase() != address.toLocaleLowerCase()) continue;
        tx_id = checkRequest.data.data[j].transaction_id;
        amount = checkRequest.data.data[j].value / 1000000;

        deposit = await Deposits.findOne({
          tx_id: tx_id,
        }).exec();

        if (deposit === null) {
          let _contract = checkRequest.data.data[j].token_info.address;
          let getContractInfo = await ContractAddressSchema.findOne({ contract: _contract });
          if (getContractInfo == null) continue;
          let coinInfo = await CoinList.findOne({ _id: getContractInfo.coin_id });
          if (coinInfo == null) continue;
          utilities.addDeposit(
            user_id,
            coinInfo.symbol,
            amount,
            address,
            tx_id,
            getContractInfo.coin_id,
            networkId
          );
        }
      }
    }
  }
} catch(err) {
  console.log("TRON Contract Deposit err : ", err.message);
}
}

module.exports = checkTronContractDeposit;