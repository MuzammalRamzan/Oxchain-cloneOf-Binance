"use strict";
var authenticator = require("authenticator");
const User = require("./models/User");
const Wallet = require("./models/Wallet");
const CoinList = require("./models/CoinList");
const Referral = require("./models/Referral");
const UserRef = require("./models/UserRef");
const Pairs = require("./models/Pairs");
const Orders = require("./models/Orders");
const LoginLogs = require("./models/LoginLogs");
const SecurityKey = require("./models/SecurityKey");
const ContractAddressSchema = require("./models/ContractAddress");
const Deposits = require("./models/Deposits");
const Notification = require("./models/Notifications");
const ReadNotification = require("./models/ReadNotifications");
const axios = require("axios");
const NotificationTokens = require("./models/NotificationTokens");
const Withdraws = require("./models/Withdraw");
var authFile = require("./auth.js");
var notifications = require("./notifications.js");
var utilities = require("./utilities.js");
const WalletAddress = require("./models/WalletAddress");
const Connection = require("./Connection");
const schedule = require('node-schedule');
const fs = require('fs');
require("dotenv").config();

//var formattedKey = authenticator.generateKey();
//var formattedToken = authenticator.generateToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse");
//console.log(authenticator.verifyToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse", "260180"));
//console.log(formattedToken);

const express = require("express");
var route = express();

const delay = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};
const { createHash } = require("crypto");
var mongodbPass = process.env.MONGO_DB_PASS;


var cors = require("cors");
route.use(cors());

var port = 3031;
var bodyParser = require("body-parser");

const multer = require("multer");
const { Console } = require("console");
const { exit } = require("process");

const auth = require("./auth.js");
const { ObjectID, ObjectId } = require("bson");
const checkTRXDeposit = require("./CronController/checkTRXDeposit");
const checkTronContractDeposit = require("./CronController/checkTronContractDeposit");
const SOLTransfer = require("./CronController/SOLTransfer");
const checkETHDeposit = require("./CronController/checkETHDeposit");
const checkERCContractDeposit = require("./CronController/checkERCContractDeposit");
const checkBNBDeposit = require("./CronController/checkBNBDeposit");
const { PostRequestSync } = require("./utilities.js");

const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});






async function checkBTCTransfer() {
  let networkID = "635916ade5f78e20c0bb809c";
  const coinID = "62aaf66c419ff12e16168c8e";
  let wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    let getBalance = await await axios.request({
      method: "post",
      url: "http://3.15.2.155",
      data: "request=balance&address=" + wallet.wallet_address,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (getBalance.data.status == 'success') {
      let balance = parseFloat(getBalance.data.data);

      return;
      if (balance > 0.05) {
        let adminAdr = process.env.BSCADDR;
        let transfer = await PostRequestSync("http://44.203.2.70:4458/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        if (transfer.data.status == 'success') {
          await Wallet.findOneAndUpdate(
            { user_id: wallet.user_id, coin_id: coinID },
            { $inc: { amount: balance } },
          );
        }
      }
    }

  });
}


OxhainTasks();
async function OxhainTasks() {
  await Connection.connection();
  console.log("db connected");

  let getWalletInfo = null;
  //ADMIN TRANSFER
  schedule.scheduleJob('*/1 * * * *', async function () {
  let deposits = await Deposits.find({ move_to_admin: false, netowrk_id: { $exists: true } });
  
  deposits.reverse();
  for (var i = 0; i < deposits.length; i++) {
    let depo = deposits[i];

    switch (depo.netowrk_id.toString()) {
      case "635916ade5f78e20c0bb809c":
        //BTC

        break;
      case "6358f17cbc20445270757291":
        //TRC20
        let getTRXData = await PostRequestSync("http://54.172.40.148:4456/trx_balance", { address: depo.address });
        if (getTRXData.data.status == 'success') {
          let balance = getTRXData.data.data;
          if (balance < 13000000) {
            let trx_txid = await PostRequestSync("http://54.172.40.148:4456/trx_transfer", { from: process.env.TRCADDR, to: depo.address, pkey: process.env.TRCPKEY, amount: 13000000 });
          }
          let _amount = parseFloat(depo.amount) * 1000000
          getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
          let usdt_transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { to: process.env.TRCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: _amount });
          if (usdt_transaction.data.status == 'success') {
            depo.move_to_admin = true;
            depo.save();
          }
        }

        break;
      case "6358f354733321c968f40f6b":
        //ERC20
        

        getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
        if (depo.currency == 'ETH') {
          let amount = parseFloat(depo.amount);
          let transaction = await PostRequestSync("http://54.167.28.93:4455/transfer", { to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });


        } else {

          let contractInfo = await ContractAddressSchema.findOne({ coin_id: depo.coin_id, network_id: depo.netowrk_id });
          let amount = parseFloat(depo.amount);
          let transaction = await PostRequestSync("http://54.167.28.93:4455/contract_transfer", { token: depo.currency, to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });

          if (transaction.data.status == 'success') {
            depo.move_to_admin = true;
            depo.save();
          }

        }
        break;

      case "63638ae4372052a06ffaa0be":

        break;

        case "6359169ee5f78e20c0bb809a" : 
        //BEP20
        getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
        let amount = depo.amount;
        if(depo.currency == 'BNB') {
          
          let transaction = await PostRequestSync("http://44.203.2.70:4458/transfer", 
          { to: process.env.BSCADDR, from: depo.address, pkey: getWalletInfo.private_key, amount: amount });
          if(transaction.data.status == 'success') {
            depo.move_to_admin = true;
            depo.save();
          }
        } else {

        }
        return;
        break;

    }
  }
    });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkTRXDeposit();
    
  });
  schedule.scheduleJob('*/2 * * * *', async function () {
    checkTronContractDeposit();
    
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    SOLTransfer();
    
  });

  schedule.scheduleJob('*/4 * * * *', async function () {
    checkETHDeposit();
    
  });


  schedule.scheduleJob('*/4 * * * *', async function () {
    checkERCContractDeposit();
    
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkBNBDeposit();
    
  });

}



route.listen(port, () => {
  console.log("server is running on port " + port);
});
