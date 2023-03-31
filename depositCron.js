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
var ethKey = process.env.ETH_API_KEY;
var bscKey = process.env.BSC_API_KEY;


var cors = require("cors");
route.use(cors());

var port = 3031;
var bodyParser = require("body-parser");

const multer = require("multer");
const { Console } = require("console");
const { exit } = require("process");

const auth = require("./auth.js");
const { ObjectID, ObjectId } = require("bson");
const checkSOLDeposit = require("./CronController/checkDeposits/checkSOLDeposit");
const checkBNBDeposit = require("./CronController/checkDeposits/checkBNBDeposit");
const checkETHDeposit = require("./CronController/checkDeposits/checkETHDeposit");
const checkERCContractDeposit = require("./CronController/checkDeposits/checkERCContractDeposit");
const checkTronContractDeposit = require("./CronController/checkDeposits/checkTronContractDeposit");
const checkTRXDeposit = require("./CronController/checkDeposits/checkTRXDeposit");
const checkBTCDeposit = require("./CronController/checkDeposits/checkBTCDeposit");
const checkBSCDeposit = require("./CronController/checkDeposits/checkBSCDeposit");
const mailer = require("./mailer");

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

async function checkSOLTransfer() {
  var networkID = "63638ae4372052a06ffaa0be";
  const coinID = "63625ff4372052a06ffaa0af";
  var wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    var getBalance = await PostRequestSync("http://" + process.env.SOLANAHOST + "/balance", { address: wallet.wallet_address });
    if (getBalance.data.status == 'success') {
      if (getBalance.data.data > 0) {
        var balance = parseFloat(getBalance.data.data);
        var adminAdr = process.env.SOLADDR;

        var transfer = await PostRequestSync("http://" + process.env.SOLANAHOST + "/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
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
  var networkID = "635916ade5f78e20c0bb809c";
  const coinID = "62aaf66c419ff12e16168c8e";
  var wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    var getBalance = await await axios.request({
      method: "post",
      url: "http://" + process.env.BTCSEQHOST,
      data: "request=balance&address=" + wallet.wallet_address,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (getBalance.data.status == 'success') {
      var balance = parseFloat(getBalance.data.data);

      if (balance > 0.05) {
        var adminAdr = process.env.BSCADDR;
        var transfer = await PostRequestSync("http://" + process.env.BSC20HOST + "/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
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
  //ADMIN TRANSFER
  var  getTRXData = null;
  var getWalletInfo = null;

  schedule.scheduleJob('*/3 * * * *', async function () {
    var deposits = await Deposits.find({ move_to_admin: false, netowrk_id: { $exists: true } });

    deposits.reverse();
    for (var i = 0; i < deposits.length; i++) {
      var depo = deposits[i];
      try {
        switch (depo.netowrk_id.toString()) {
          case "635916ade5f78e20c0bb809c":
            //BTC
            var getBTCBalance = await axios.request({
              method: "post",
              url: "http://" + process.env.BTCSEQHOST,
              data: "request=balance&address=" + depo.address,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            });
            var balance = 0;
            if (getBTCBalance.data.status == 'success')
              balance = getBTCBalance.data.data;
            if (balance > 0) {
              var transaction = await axios.request({
                method: "post",
                url: "http://" + process.env.BTCSEQHOST,
                data: "request=transfer&to=bc1qkkycm093crxdpga0e6m8cu9td0a3svdf3fer6a&amount=" + depo.amount,
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              });
            }
            break;
          case "6358f17cbc20445270757291":
            //TRC20
            if(depo.currency != 'USDT') break;
            if (depo.status == 2) break;
            var deposit = depo;
            var getUSDTBalance = await PostRequestSync("http://54.172.40.148:4456/usdt_balance", { address: deposit.address });
            if (getUSDTBalance.data.status != 'success') {
              console.log(getUSDTBalance.data);
              continue;
            }
            var usdtBalance = parseFloat(getUSDTBalance.data.data)
            if (usdtBalance < (parseFloat(deposit.amount) * 1000000)) {
              continue;
            }

            var depositFeeReq = await axios('http://54.172.40.148:4456/calc_estimated_fee?from=' + deposit.address + '&contract=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&amount=' + (parseFloat(deposit.amount) * 1000000));
            var feeData = depositFeeReq.data;
            if (feeData.status != 'success') continue;
            var fee = feeData.data;
            getTRXData = await PostRequestSync("http://54.172.40.148:4456/trx_balance", { address: deposit.address });
            if (getTRXData.data.status != 'success') {
              console.log(getTRXData.data);
              continue;
            }
            var trx_balance = getTRXData.data.data;
            if (trx_balance < fee) {
              var inc = fee - trx_balance;
              var trx_txid = await PostRequestSync("http://54.172.40.148:4456/trx_transfer", { from: process.env.TRCADDR, to: deposit.address, pkey: process.env.TRCPKEY, amount: inc });
            }
            console.log(trx_balance, fee, deposit.address);
            var _amount = parseFloat(deposit.amount) * 1000000
             getWalletInfo = await WalletAddress.findOne({ wallet_address: deposit.address });
            var usdt_transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { to: process.env.TRCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: _amount });
            if (usdt_transaction.data.status == 'success') {
              deposit.move_to_admin = true;
              deposit.status = 2;
              deposit.save();

              mailer.sendMail("support@oxhain.com", "Deposit moved to admin", deposit.tx_id + "  data moved to admin with " + usdt_transaction.data.data + " hash code ");
            }

            getTRXData = await PostRequestSync("http://54.172.40.148:4456/trx_balance", { address: depo.address });
            if (getTRXData.data.status == 'success') {
              var balance = getTRXData.data.data;
              if (balance < 12000000) {
                var trx_txid = await PostRequestSync("http://54.172.40.148:4456/trx_transfer", { from: process.env.TRCADDR, to: depo.address, pkey: process.env.TRCPKEY, amount: 12000000 });
              }
              var _amount = parseFloat(depo.amount) * 1000000
              var getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
              var usdt_transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { to: process.env.TRCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: _amount });
              if (usdt_transaction.data.status == 'success') {
                depo.move_to_admin = true;
                depo.save();

                mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + usdt_transaction.data.data + " hash code ");
              }
            }

            break;
          case "6358f354733321c968f40f6b":
            //ERC20

            var getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
            if (depo.currency == 'ETH') {
              var amount = parseFloat(depo.amount);
              if (amount >= 0.05) {
                var transaction = await PostRequestSync("http://" + process.env.ERC20HOST + "/transfer", { to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });
                if (transaction.data.status == 'success') {
                  depo.move_to_admin = true;
                  depo.save();
                  mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");
                }
              }

            } else {

              var amount = parseFloat(depo.amount);
              if (amount < 5) continue;
              var transaction = await PostRequestSync("http://" + process.env.ERC20HOST + "/contract_transfer", { token: depo.currency, to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });
              if (transaction.data.status == 'success') {
                depo.move_to_admin = true;
                depo.save();
                mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");
              }

            }

            break;
          case "63638ae4372052a06ffaa0be":
            var getWalletInfoS = await WalletAddress.findOne({ wallet_address: depo.address });
            //SOL
            if (depo.currency == 'SOL') {
              var transfer = await PostRequestSync("http://" + process.env.SOLANAHOST + "/transfer", { from: getWalletInfoS.wallet_address, to: process.env.SOLADDR, pkey: getWalletInfoS.private_key, amount: depo.amount });
              if (transfer.data.status == 'success') {
                depo.move_to_admin = true;
                await depo.save();
                mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transfer.data.data + " hash code ");
              }
            } else {
              var ctransfer = await PostRequestSync("http://" + process.env.SOLANAHOST + "/contract_transfer", { contract: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", from: getWalletInfoS.wallet_address, to: process.env.SOLADDR, pkey: getWalletInfoS.private_key, amount: depo.amount });
              if (ctransfer.data.status == 'success') {
                depo.move_to_admin = true;
                await depo.save();
                mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + ctransfer.data.data + " hash code ");
              }
            }
            break;
          case "6359169ee5f78e20c0bb809a":
            //BSC

            var getWalletInfoB = await WalletAddress.findOne({ wallet_address: depo.address });
            if (depo.currency == 'BNB') {
              var amount = parseFloat(depo.amount);
              if (amount >= 0.001) {
                var transaction = await PostRequestSync("http://" + process.env.BSC20HOST + "/transfer", { to: process.env.BSCADDR, from: getWalletInfoB.wallet_address, pkey: getWalletInfoB.private_key, amount: amount });
                if (transaction.data.status == 'success') {
                  depo.move_to_admin = true;
                  depo.save();
                  mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");
                }
              }

            } else {

              var amount = parseFloat(depo.amount);
              if (amount < 5) continue;
              var transaction = await PostRequestSync("http://" + process.env.BSC20HOST + "/contract_transfer", { token: depo.currency, to: process.env.BSCADDR, from: getWalletInfoB.wallet_address, pkey: getWalletInfoB.private_key, amount: amount });
              if (transaction.data.status == 'success') {

                depo.move_to_admin = true;
                depo.save();
                mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");

              }

            }
            break;
        }
      } catch (err) {
        console.log(err);
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
    checkSOLDeposit();
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkBTCDeposit();
  });

  schedule.scheduleJob('*/3 * * * *', async function () {
    checkERCContractDeposit();
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkETHDeposit();
  });

  schedule.scheduleJob('*/2 * * * *', async function () {
    checkBNBDeposit();
  });
  schedule.scheduleJob('*/2 * * * *', async function () {
    checkBSCDeposit();
  });
  //checkETHDeposit();
}

route.all("/btcDepositCheck", async (req, res) => {
  //100 milyona böl

  //transaction

  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);

  var networkId = "635916ade5f78e20c0bb809c";
  if (result === true) {
    var wallet = await Wallet.find({
      status: 1,
      network_id: "635916ade5f78e20c0bb809c",
    }).exec();

    for (let i = 0; i < wallet.length; i++) {
      var address = wallet[i].wallet_address;
      var user_id = wallet[i].user_id;
      if (address == null) continue;
      if (address.length > 0) {
        var checkRequest = await axios.request({
          method: "post",
          url: "http://" + process.env.BTCSEQHOST,
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

route.listen(port, () => {
  console.log("server is running on port " + port);
});
