"use strict";
var authenticator = require("authenticator");
const User = require("./models/Test");
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

require("dotenv").config();

//var formattedKey = authenticator.generateKey();
//var formattedToken = authenticator.generateToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse");
//console.log(authenticator.verifyToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse", "260180"));
//console.log(formattedToken);

const express = require("express");
var route = express();
const mongoose = require("mongoose");
const delay = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};
const { createHash } = require("crypto");
var mongodbPass = process.env.MONGO_DB_PASS;
var ethKey = process.env.ETH_API_KEY;
var bscKey = process.env.BSC_API_KEY;

var connection =
  "mongodb+srv://volkansaka:" +
  mongodbPass +
  "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(connection, (e) => {
  if (e) {
    console.log("test" + e);
  } else {
    console.log("connected");
  }
});

var cors = require("cors");
route.use(cors());

var port = 3031;
var bodyParser = require("body-parser");

const multer = require("multer");
const { Console } = require("console");
const { exit } = require("process");
const { isFloat32Array } = require("util/types");
const auth = require("./auth.js");
const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});

route.all("/ethDepositCheck", async (req, res) => {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let wallet = await Wallet.find({
      status: 1,
      coin_id: "62b0324644fd00083973866b",
    }).exec();

    for (let i = 0; i < wallet.length; i++) {
      let address = wallet[i].address;
      let user_id = wallet[i].user_id;
      if (address.length > 0) {
        let checkRequest = await axios.get(
          "https://api.etherscan.io/api?module=account&action=txlist&address=" +
            address +
            "&endblock=latest&apikey=" +
            ethKey
        );

        var amount = "";
        var user = "";
        var tx_id = "";
        var deposit = "";

        for (let j = 0; j < checkRequest.data.length; j++) {
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
                "ETH",
                amount,
                address,
                checkRequest.data.result[j].hash,
                "62b0324644fd00083973866b"
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

route.all("/bnbDepositCheck", async (req, res) => {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let wallet = await Wallet.find({
      status: 1,
      coin_id: "62fb45483f8c1ffba43e4813",
    }).exec();

    for (let i = 0; i < wallet.length; i++) {
      let address = wallet[i].address;
      let user_id = wallet[i].user_id;
      console.log(address);

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
                "62fb45483f8c1ffba43e4813"
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

  if (result === true) {
    let wallet = await Wallet.find({
      status: 1,
      coin_id: "62aaf66c419ff12e16168c8e",
    }).exec();

    for (let i = 0; i < wallet.length; i++) {
      let address = wallet[i].address;
      let user_id = wallet[i].user_id;
      if (address.length > 0) {
        let checkRequest = await axios.request({
          method: "post",
          url: "http://3.15.2.155",
          data: "request=transactions&address=bc1q0wr6kdysv7sdskcazt7ekjlak3l5j006jgvkvx",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        var amount = "";
        var user = "";
        var tx_id = "";
        var deposit = "";
        for (let j = 0; j < checkRequest.data.data.length; j++) {
          console.log(checkRequest.data.data[j]);

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
              "62aaf66c419ff12e16168c8e"
            );

            console.log("deposit added");
          } else {
            console.log("deposit exists");
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

  if (result === true) {
    let wallet = await Wallet.find({
      status: 1,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).exec();

    let tx_id = "";
    let user_id = "";
    let amount = "";
    let address = "";
    let deposit = "";

    for (let i = 0; i < wallet.length; i++) {
      let address = wallet[i].address;

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
              "62bc116eb65b02b777c97b3d"
            );

            console.log("deposit added");
          } else {
            console.log("deposit exists");
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
