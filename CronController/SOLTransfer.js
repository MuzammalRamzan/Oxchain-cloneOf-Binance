const axios = require("axios");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletAddress = require("../models/WalletAddress");
const CoinList = require("../models/CoinList");
const ContractAddressSchema = require("../models/ContractAddress");
const Deposits = require("../models/Deposits");
var authFile = require("../auth.js");
const { PostRequestSync } = require("../utilities");
require("dotenv").config();
const SOLTransfer = async() => {

  let networkID = "63638ae4372052a06ffaa0be";
  const coinID = "63625ff4372052a06ffaa0af";
  let wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    
    let getBalance = await PostRequestSync("http://3.144.178.156:4470/balance", { address: wallet.wallet_address });
    if (getBalance.data.status == 'success') {
      if (getBalance.data.data > 0) {
        let balance = parseFloat(getBalance.data.data);
        let adminAdr = process.env.SOLADDR;

        let transfer = await PostRequestSync("http://3.144.178.156:4470/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        
        if (transfer.data.status == 'success') {
          let add = parseFloat(balance) / 1000000000.0;
          await Wallet.findOneAndUpdate(
            { user_id: wallet.user_id, coin_id: coinID },
            { $inc: { amount: add } },
          );
        }
      }
    }

  });
}

module.exports = SOLTransfer;