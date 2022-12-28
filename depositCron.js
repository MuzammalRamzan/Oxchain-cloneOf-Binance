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
var ethKey = process.env.ETH_API_KEY;
var bscKey = process.env.BSC_API_KEY;

Connection.connection();

var cors = require("cors");
route.use(cors());

var port = 3031;
var bodyParser = require("body-parser");

const multer = require("multer");
const { Console } = require("console");
const { exit } = require("process");

const auth = require("./auth.js");
const ContractAddress = require("./models/ContractAddress");
const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});

function PostRequestSync(url, data) {
  return new Promise((resolve, reject) => {
    axios.post(url, data).then(response => resolve(response)).catch(error => reject(error));
  });
}

async function OxhainTasks() {


  schedule.scheduleJob('*/2 * * * *', async function () {
    let deposits = await Deposits.find({ move_to_admin: false, netowrk_id: { $exists: true } });
    for (var i = 0; i < deposits.length; i++) {
      let depo = deposits[i];
      console.log(depo.netowrk_id);
      switch (depo.netowrk_id.toString()) {
        case "635916ade5f78e20c0bb809c":
          //BTC

          break;
        case "6358f17cbc20445270757291":
          //TRC20
          let getTRXData = await PostRequestSync("http://54.172.40.148:4456/trx_balance", { address: depo.address });
          if (getTRXData.data.status == 'success') {
            let balance = getTRXData.data.data;
            if (balance < 12000000) {
              let trx_txid = await PostRequestSync("http://54.172.40.148:4456/trx_transfer", { from: process.env.TRCADDR, to: depo.address, pkey: process.env.TRCPKEY, amount: 12000000 });
              console.log(trx_txid.data);
            }
            let _amount = parseFloat(depo.amount) * 1000000
            let getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
            let usdt_transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { to: process.env.TRCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: _amount });
            if (usdt_transaction.data.status == 'success') {
              depo.move_to_admin = true;
              depo.save();
            }
          }
          console.log();
          break;
        case "6358f354733321c968f40f6b":
          //ERC20
          console.log("ERC DEPOSIT");
          console.log(depo.currency);
          let getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
          if (depo.currency == 'ETH') {
            let amount = parseFloat(depo.amount);
            let transaction = await PostRequestSync("http://54.167.28.93:4455/transfer", { to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });

            console.log(transaction.data);
          } else {

            let contractInfo = await ContractAddress.findOne({ coin_id: depo.coin_id, network_id: depo.netowrk_id });
            let amount = parseFloat(depo.amount);
            let transaction = await PostRequestSync("http://54.167.28.93:4455/contract_transfer", { token: depo.currency, to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });
            console.log(transaction.data);
            if (transaction.data.status == 'success') {
              depo.move_to_admin = true;
              depo.save();
            }

          }
          break;

        case "63638ae4372052a06ffaa0be":

          break;
      }
    }
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkSOLTransfer();
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkETHTransfer();
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkBNBTransfer();
  });

}

//OxhainTasks();

route.all("/ethDepositCheck", async (req, res) => {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  let networkId = "6358f354733321c968f40f6b";
  if (result === true) {
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
        console.log(checkRequest.data.message);
        if (checkRequest.data.message === "OK") {
          console.log(checkRequest.data.result.length);
          for (let j = 0; j < checkRequest.data.result.length; j++) {

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

              console.log("deposit added");
            } else {
            }
          }
        }
      } else {
        console.log("no address");
      }
    }
    res.json("cron_success");
  } else {
    res.json("error");
  }
});

async function checkSOLTransfer() {
  let networkID = "63638ae4372052a06ffaa0be";
  const coinID = "63625ff4372052a06ffaa0af";
  let wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    let getBalance = await PostRequestSync("http://3.144.178.156:4470/balance", { address: wallet.wallet_address });
    if (getBalance.data.status == 'success') {
      if (getBalance.data.data > 0) {
        let balance = parseFloat(getBalance.data.data);
        let adminAdr = process.env.SOLADDR;
        console.log({ from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        let transfer = await PostRequestSync("http://3.144.178.156:4470/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
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

async function checkETHTransfer() {
  const networkID = "6358f354733321c968f40f6b";
  const coinID = "62b0324644fd00083973866b";
  let wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    let getBalance = await PostRequestSync("http://54.167.28.93:4455/balance", { address: wallet.wallet_address });
    if (getBalance.data.status == 'success') {
      let balance = parseFloat(getBalance.data.data);
      if (balance > 0.01) {
        let adminAdr = process.env.ERCADDR;
        console.log({ from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        let transfer = await PostRequestSync("http://54.167.28.93:4455/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        console.log(transfer.data);
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

async function checkBNBTransfer() {
  let networkID = "6359169ee5f78e20c0bb809a";
  const coinID = "62fb45483f8c1ffba43e4813";
  let wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    let getBalance = await PostRequestSync("http://44.203.2.70:4458/balance", { address: wallet.wallet_address });
    if (getBalance.data.status == 'success') {
      let balance = parseFloat(getBalance.data.data);
      if (balance > 0.05) {
        let adminAdr = process.env.BSCADDR;
        console.log({ from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        let transfer = await PostRequestSync("http://44.203.2.70:4458/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        console.log(transfer.data);
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
      console.log(balance);
      return;
      if (balance > 0.05) {
        let adminAdr = process.env.BSCADDR;
        console.log({ from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        let transfer = await PostRequestSync("http://44.203.2.70:4458/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
        console.log(transfer.data);
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

async function checkSOLUSDT() {
  let networkID = "63638ae4372052a06ffaa0be";
  let wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    let getBalance = await PostRequestSync("http://3.144.178.156:4470/balance", { address: wallet.wallet_address });
    console.log(getBalance.data);
    return;
  });

}

route.all("/bnbDepositCheck", async (req, res) => {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  let networkId = "6359169ee5f78e20c0bb809a";
  if (result === true) {
    let wallet = await Wallet.find({
      status: 1,
      network_id: "6359169ee5f78e20c0bb809a",
    }).exec();

    for (let i = 0; i < wallet.length; i++) {
      let address = wallet[i].wallet_address;
      if (address == null || address == '') continue;
      let user_id = wallet[i].user_id;

      if (address.length > 0) {
        let checkRequest = await axios.get(
          "https://api.bscscan.com/api?module=account&action=txlist&address=" +
          address +
          "&endblock=latest&apikey=" +
          bscKey
        );

        var amount = "";
        var user = "";
        var tx_id = "";
        var deposit = "";

        for (let j = 0; j < checkRequest.data.result.length; j++) {
          if (checkRequest.data.message === "OK") {
            amount = checkRequest.data.result[j].value / 1000000000000000000;
            user = await User.findOne({ _id: user_id }).exec();
            deposit = await Deposits.findOne({
              user_id: user_id,
              tx_id: checkRequest.data.result[j].hash,
            }).exec();

            if (deposit === null) {
              utilities.addDeposit(
                user_id,
                "BNB",
                amount,
                address,
                checkRequest.data.result[0].hash,
                "62fb45483f8c1ffba43e4813",
                networkId
              );

              console.log("deposit added");
            } else {
              console.log("deposit exists");
            }
          }
        }
      } else {
        console.log("no address");
      }
    }
    res.json("cron_success");
  } else {
    res.json("error");
  }
});

route.all("/btcDepositCheck", async (req, res) => {
  //100 milyona böl

  //transaction

  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  let networkId = "635916ade5f78e20c0bb809c";
  if (result === true) {
    let wallet = await Wallet.find({
      status: 1,
      network_id: "635916ade5f78e20c0bb809c",
    }).exec();

    for (let i = 0; i < wallet.length; i++) {
      let address = wallet[i].wallet_address;
      let user_id = wallet[i].user_id;
      if (address == null) continue;
      if (address.length > 0) {
        let checkRequest = await axios.request({
          method: "post",
          url: "http://3.15.2.155",
          data: "request=transactions&address=" + address,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        var amount = "";
        var user = "";
        var tx_id = "";
        var deposit = "";
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

            console.log("deposit added");
          } else {
          }
        }
      } else {
        console.log("no address");
      }
    }
    res.json("cron_success");
  } else {
    res.json("error");
  }
});

route.all("/usdtDepositCheck", async (req, res) => {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  let networkId = "6358f17cbc20445270757291";
  if (result === true) {
    let wallet = await WalletAddress.find({
      status: 1,
      network_id: "6358f17cbc20445270757291",
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
        let checkRequest = await axios.get(
          "https://api.trongrid.io/v1/accounts/" +
          address +
          "/transactions/trc20?limit=20&contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
        );

        for (let j = 0; j < checkRequest.data.data.length; j++) {
          tx_id = checkRequest.data.data[j].transaction_id;
          amount = checkRequest.data.data[j].value / 1000000;

          deposit = await Deposits.findOne({
            user_id: user_id,
            tx_id: tx_id,
          }).exec();

          if (deposit === null) {
            utilities.addDeposit(
              user_id,
              "USDT",
              amount,
              address,
              tx_id,
              "62bc116eb65b02b777c97b3d",
              networkId
            );
            console.log("deposit added");
          } else {
          }
        }
      } else {
        console.log("no address");
      }
    }
    res.json("cron_success");
  } else {
    res.json("error");
  }
});



route.all("/usdtDepositCheckERC", async (req, res) => {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  console.log("başlıyor");

  let networkId = "6358f354733321c968f40f6b";
  if (result === true) {
    let wallet = await WalletAddress.find({
      status: 1,
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
      console.log(address);
      if (address.length > 1) {
        let checkRequest = await axios.get(
          "https://api.etherscan.io/api?module=account&action=tokentx&address=" +
          address +
          "&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=HH7FVKBY1U74K1VUYTUN1C4X973XN214FK&contractaddress=0xdAC17F958D2ee523a2206206994597C13D831ec7"
        );

        if (checkRequest.data.result.length > 0) {
          for (let j = 0; j < checkRequest.data.result.length; j++) {
            tx_id = checkRequest.data.result[j].transaction_id;
            amount = checkRequest.data.result[j].value / 1000000;

            deposit = await Deposits.findOne({
              user_id: user_id,
              tx_id: tx_id,
            }).exec();

            if (deposit === null) {
              utilities.addDeposit(
                user_id,
                "USDT",
                amount,
                address,
                tx_id,
                "62bc116eb65b02b777c97b3d",
                networkId
              );
              console.log("deposit added");
            } else {
            }
          }
        }
      } else {
      }
    }
    res.json("cron_success");
  } else {
    res.json("errorRR");
  }
});

route.listen(port, () => {
  console.log("server is running on port " + port);
});
