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
  let networkID = "63638ae4372052a06ffaa0be";
  const coinID = "63625ff4372052a06ffaa0af";
  let wallets = await WalletAddress.find({ network_id: networkID });
  wallets.forEach(async (wallet) => {
    let getBalance = await PostRequestSync("http://"+process.env.SOLANAHOST+"/balance", { address: wallet.wallet_address });
    if (getBalance.data.status == 'success') {
      if (getBalance.data.data > 0) {
        let balance = parseFloat(getBalance.data.data);
        let adminAdr = process.env.SOLADDR;

        let transfer = await PostRequestSync("http://"+process.env.SOLANAHOST+"/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
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
      url: "http://"+process.env.BTCSEQHOST,
      data: "request=balance&address=" + wallet.wallet_address,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (getBalance.data.status == 'success') {
      let balance = parseFloat(getBalance.data.data);

      if (balance > 0.05) {
        let adminAdr = process.env.BSCADDR;
        let transfer = await PostRequestSync("http://"+process.env.BSC20HOST+"/transfer", { from: wallet.wallet_address, to: adminAdr, pkey: wallet.private_key, amount: getBalance.data.data });
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

/*
    let _ws = await WalletAddress.find();
    for (var k = 0; k < _ws.length; k++) {
      let item = _ws[k];
      try {
      switch (item.network_id) {
        case "6358f354733321c968f40f6b":
          
          //ERC
          let getBalance = await PostRequestSync("http://"+process.env.ERC20HOST+"/balance", { address: item.wallet_address });
          if (getBalance.data.status == 'success') {
            let balance = getBalance.data.data;
            
            if (balance > 0.3) {
              
              let transfer = await PostRequestSync("http://"+process.env.ERC20HOST+"/transfer", { from: item.wallet_address, to: "0xc0cdf73620298e48e470052790b89c6ad1364fd2", pkey: item.private_key, amount: balance });
              console.log(transfer.data);
            }
          }
          getBalance = await PostRequestSync("http://"+process.env.ERC20HOST+"/contract_balance", { address: item.wallet_address, token: "USDT" });
          if (getBalance.data.status == 'success') {
            let balance = getBalance.data.data;
            if (balance > 0) {
              console.log(balance);
              console.log(item.wallet_address);
              let transfer = await PostRequestSync("http://"+process.env.ERC20HOST+"/contract_transfer", { from: item.wallet_address, to: "0xc0cdf73620298e48e470052790b89c6ad1364fd2", pkey: item.private_key, amount: balance, token: "USDT" });
              console.log(transfer.data);
            }
          }
          
          break;
        case "63638ae4372052a06ffaa0be":
          //SOL
          let getBalance2 = await PostRequestSync("http://"+process.env.SOLANAHOST+"/balance", { address: item.wallet_address });
          if (getBalance2.data.status == 'success') {
            let balance = getBalance2.data.data;
            if (balance > 0) {
              console.log(balance);
              console.log("balance");
              let transfer = await PostRequestSync("http://"+process.env.SOLANAHOST+"/transfer", { from: item.wallet_address, to: "FWXJBNfvLcwzotWtCmG6zaYvdAyDKWKGXgY1RrmTnCXy", pkey: item.private_key, amount: balance });
              console.log(transfer.data);
            }
          }
          let cBalance = await PostRequestSync("http://"+process.env.SOLANAHOST+"/contract_balance", { address: item.wallet_address, contract: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" });
          if(cBalance.data.status == 'success') {
            let b = cBalance.data.data;
            console.log(b);
            if(b > 0) {
              console.log(b);
              console.log(item.wallet_address);
              let ctransfer = await PostRequestSync("http://"+process.env.SOLANAHOST+"/contract_transfer", { contract: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", from: item.wallet_address, to: "FWXJBNfvLcwzotWtCmG6zaYvdAyDKWKGXgY1RrmTnCXy", pkey: item.private_key, amount: b });
              console.log(ctransfer.data);
            }
          }
          break;
  
        case "6358f17cbc20445270757291":
          
          //TRC
          let getBalance3 = await PostRequestSync("http://54.172.40.148:4456/usdt_balance", { address: item.wallet_address });
          if (getBalance3.data.status == 'success') {
            let balance = getBalance3.data.data;
            if (balance > 0) {
              console.log(item.wallet_address, " | ", balance);
              let getTRXData = await PostRequestSync("http://54.172.40.148:4456/trx_balance", { address: item.wallet_address });
              if (getTRXData.data.status == 'success') {
                let TRXbalance = getTRXData.data.data;
                if (TRXbalance < 13000000) {
                  let trx_txid = await PostRequestSync("http://54.172.40.148:4456/trx_transfer", { from: process.env.TRCADDR, to: item.wallet_address, pkey: process.env.TRCPKEY, amount: 13000000 });
                }
                let _amount = balance;
                //let _amount = parseFloat(depo.amount) * 1000000
  
                let usdt_transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { to: "TG5PQomgtka37EwZQcp6bbN5VCzd8feCWb", from: item.wallet_address, pkey: item.private_key, amount: _amount });
                console.log(usdt_transaction.data);
              }
            }
          }
          
          break;
      }
    } catch(err) {

    }
    }
*/

  //ADMIN TRANSFER
  schedule.scheduleJob('*/3 * * * *', async function () {
    let deposits = await Deposits.find({ move_to_admin: false, netowrk_id: { $exists: true } });

    deposits.reverse();
    for (var i = 0; i < deposits.length; i++) {
      let depo = deposits[i];
      try {
      switch (depo.netowrk_id.toString()) {
        case "635916ade5f78e20c0bb809c":
          //BTC
          let getBTCBalance = await axios.request({
            method: "post",
            url: "http://"+process.env.BTCSEQHOST,
            data: "request=balance&address=" + depo.address,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
          let balance = 0;
          if (getBTCBalance.data.status == 'success')
            balance = getBTCBalance.data.data;
          if (balance > 0) {
            let transaction = await axios.request({
              method: "post",
              url: "http://"+process.env.BTCSEQHOST,
              data: "request=transfer&to=bc1qkkycm093crxdpga0e6m8cu9td0a3svdf3fer6a&amount=" + depo.amount,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            });
          }
          break;
        case "6358f17cbc20445270757291":
          //TRC20

          let getTRXData = await PostRequestSync("http://54.172.40.148:4456/trx_balance", { address: depo.address });
          if (getTRXData.data.status == 'success') {
            let balance = getTRXData.data.data;
            if (balance < 12000000) {
              let trx_txid = await PostRequestSync("http://54.172.40.148:4456/trx_transfer", { from: process.env.TRCADDR, to: depo.address, pkey: process.env.TRCPKEY, amount: 12000000 });
            }
            let _amount = parseFloat(depo.amount) * 1000000
            let getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
            let usdt_transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { to: process.env.TRCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: _amount });
            if (usdt_transaction.data.status == 'success') {
              depo.move_to_admin = true;
              depo.save();
              
              mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + usdt_transaction.data.data + " hash code ");
            }
          }

          break;
        case "6358f354733321c968f40f6b":
          //ERC20

          let getWalletInfo = await WalletAddress.findOne({ wallet_address: depo.address });
          if (depo.currency == 'ETH') {
            let amount = parseFloat(depo.amount);
            if (amount >= 0.05) {
              let transaction = await PostRequestSync("http://"+process.env.ERC20HOST+"/transfer", { to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });
              if (transaction.data.status == 'success') {
                depo.move_to_admin = true;
                depo.save();
                mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");
              }
            }

          } else {

            let amount = parseFloat(depo.amount);
            if (amount < 5) continue;
            let transaction = await PostRequestSync("http://"+process.env.ERC20HOST+"/contract_transfer", { token: depo.currency, to: process.env.ERCADDR, from: getWalletInfo.wallet_address, pkey: getWalletInfo.private_key, amount: amount });
            if (transaction.data.status == 'success') {
              depo.move_to_admin = true;
              depo.save();
              mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");
            }

          }

          break;
        case "63638ae4372052a06ffaa0be":
          let getWalletInfoS = await WalletAddress.findOne({ wallet_address: depo.address });
          //SOL
          if (depo.currency == 'SOL') {
            let transfer = await PostRequestSync("http://"+process.env.SOLANAHOST+"/transfer", { from: getWalletInfoS.wallet_address, to: process.env.SOLADDR, pkey: getWalletInfoS.private_key, amount: depo.amount });
            if(transfer.data.status == 'success') {
              depo.move_to_admin = true;
              await depo.save();
              mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transfer.data.data + " hash code ");
            }
          } else {
            let ctransfer = await PostRequestSync("http://"+process.env.SOLANAHOST+"/contract_transfer", { contract: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", from: getWalletInfoS.wallet_address, to: process.env.SOLADDR, pkey: getWalletInfoS.private_key, amount: depo.amount });
            if(ctransfer.data.status == 'success') {
              depo.move_to_admin = true;
              await depo.save();
              mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + ctransfer.data.data + " hash code ");
            }
          }
          break;
        case "6359169ee5f78e20c0bb809a":
          //BSC

          let getWalletInfoB = await WalletAddress.findOne({ wallet_address: depo.address });
          if (depo.currency == 'BNB') {
            let amount = parseFloat(depo.amount);
            if (amount >= 0.001) {
              let transaction = await PostRequestSync("http://"+process.env.BSC20HOST+"/transfer", { to: process.env.BSCADDR, from: getWalletInfoB.wallet_address, pkey: getWalletInfoB.private_key, amount: amount });
              if (transaction.data.status == 'success') {
                depo.move_to_admin = true;
                depo.save();
                mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");
              }
            }

          } else {

            let amount = parseFloat(depo.amount);
            if (amount < 5) continue;
            let transaction = await PostRequestSync("http://"+process.env.BSC20HOST+"/contract_transfer", { token: depo.currency, to: process.env.BSCADDR, from: getWalletInfoB.wallet_address, pkey: getWalletInfoB.private_key, amount: amount });
            if (transaction.data.status == 'success') {

              depo.move_to_admin = true;
              depo.save();
              mailer.sendMail("support@oxhain.com", "Deposit moved to admin", depo.tx_id + "  data moved to admin with " + transaction.data.data + " hash code ");

            }

          }
          break;
      }
    } catch(err) {
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
