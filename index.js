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

var port = process.env.PORT;
var bodyParser = require("body-parser");

const multer = require("multer");
const { Console } = require("console");
const { exit } = require("process");
const { isFloat32Array } = require("util/types");
const auth = require("./auth.js");
const MarginOrder = require("./models/MarginOrder");
const MarginWallet = require("./models/MarginWallet");
const { ObjectId } = require("mongodb");
const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});

function parseCoins(coins, amounts) {
  return new Promise((resolve) => {
    let parsedCoins = [];

    for (let i = 0; i < coins.length; i++) {
      let a = coins[i].toObject();
      a.balance = amounts.filter((amount) => amount.coin_id == a._id)[0].amount;
      parsedCoins.push(a);
    }
    resolve(parsedCoins);
  });
}

function parseUsers(ref_user, user_table) {
  console.log(user_table);
  return new Promise((resolve) => {
    let parsedUsers = [];
    for (let i = 0; i < ref_user.length; i++) {
      let a = ref_user[i].toObject();
      console.log("Test u : " + a.user_id);
      a.name = user_table.filter((amount) => amount._id == a.user_id)["name"];
      a.surname = user_table.filter((amount) => amount._id == a.user_id)[
        "surname"
      ];

      parsedUsers.push(a);
    }

    resolve(parsedUsers);
  });
}

route.all("/login", upload.none(), async (req, res) => {
  let newRegisteredId;
  var api_key_result = req.body.api_key;
  var deviceName = "null";
  var deviceToken = "null";
  var deviceType = "null";
  var manufacturer = "null";
  var ip = "null";
  var searchType = req.body.searchType;
  var deviceModel = "null";
  var loginType = req.body.loginType;
  if (req.body.deviceName != undefined) {
    deviceName = req.body.deviceName;
  }

  if (req.body.deviceModel != undefined) {
    deviceModel = req.body.deviceModel;
  }

  if (req.body.deviceType != undefined) {
    deviceModel = req.body.deviceType;
  }

  if (req.body.manufacturer != undefined) {
    manufacturer = req.body.manufacturer;
  }
  if (req.body.ip != undefined) {
    ip = req.body.ip;
  }

  var notificationToken = req.body.notificationToken;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      [searchType]: req.body.user,
      password: utilities.hashData(req.body.password),
    }).exec();

    if (user != null) {
      var twofaStatus = user["twofa"];
      var results = [];
      var refId = "";
      let userRef = await UserRef.findOne({
        user_id: user._id,
      }).exec();

      refId = userRef["refCode"];
      var data = {
        response: "success",
        twofa: twofaStatus,
        status: user["status"],
        user_id: user["_id"],
        ref_id: refId,
      };

      var status = user["status"];
      if (status == 1) {
        let coins = await CoinList.find({ status: 1 }).exec();

        for (let i = 0; i < coins.length; i++) {
          let walletResult = await Wallet.findOne({
            user_id: user._id,
            coin_id: coins[i]._id,
          }).exec();
          console.log(coins[i].symbol);
          let privateKey = "";
          let address = "";
          console.log(coins[i].symbol);

          if (walletResult === null) {
            if (coins[i].symbol === "ETH") {
              let url = "http://34.239.168.239:4455/create_address";
              let walletTest = await axios.post(url);
              console.log(walletTest);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
              console.log("Adress : " + address);
              console.log("Private Key : " + privateKey);
            }

            if (coins[i].symbol === "BNB") {
              let url = "http://44.203.2.70:4458/create_address";
              let walletTest = await axios.post(url);
              console.log(walletTest);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
              console.log("Adress : " + address);
              console.log("Private Key : " + privateKey);
            }

            if (coins[i].symbol === "USDT") {
              let url = "http://54.172.40.148:4456/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address.base58;
              console.log("Adress : " + address);
              console.log("Private Key : " + privateKey);
            }

            if (coins[i].symbol === "Margin") {
              let getUsdtWalelt = await Wallet.find({ 'symbol': 'USDT' }).exec();

              privateKey = getUsdtWalelt.privateKey;
              address = getUsdtWalelt.address;
            }

            if (coins[i].symbol === "BTC") {
              let createBTC = await axios.request({
                method: "post",
                url: "http://3.15.2.155",
                data: "request=create_address",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              });

              address = createBTC.data.message;
            }
          }

          const newWallet = new Wallet({
            name: coins[i]["name"],
            symbol: coins[i]["symbol"],
            user_id: user["id"],
            amount: 0,
            coin_id: coins[i]["id"],
            type: "spot",
            privateKey: privateKey,
            address: address,
            status: 1,
          });

          let wallets = await Wallet.findOne({
            user_id: user["_id"],
            coin_id: coins[i]["id"],
          }).exec();

          if (wallets == null) {
            newWallet.save();
          } else {
            console.log("wallet already exists");
          }
        }

        let logs = await LoginLogs.findOne({
          user_id: user["_id"],
          ip: ip,
          deviceName: deviceName,
          manufacturer: manufacturer,
          model: deviceModel,
        }).exec();

        const newUserLog = new LoginLogs({
          user_id: user["_id"],
          ip: ip,
          deviceName: deviceName,
          manufacturer: manufacturer,
          model: deviceModel,
        });

        let room = await newUserLog.save();
        newRegisteredId = room.id;

        if (logs != null) {
          if (logs["trust"] == "yes") {
            data.trust = "yes";
            data.log_id = logs["_id"];
          } else {
            data.trust = "no";
            data.log_id = logs["_id"];
          }
        } else {
          data.trust = "no";
          data.log_id = newRegisteredId;
        }

        if (loginType == "mobile") {
          let response = await NotificationTokens.findOne({
            user_id: user["_id"],
            token_id: notificationToken,
          });

          if (response == null) {
            const newNotificationToken = new NotificationTokens({
              user_id: user["_id"],
              token_id: notificationToken,
            });
            newNotificationToken.save(function (err, room) {
              if (err) {
                console.log(err);
              } else {
                res.json({ status: "success", data: data });
              }
            });
          } else {
            res.json({ status: "success", data: data });
          }
        } else {
          res.json({ status: "success", data: data });
        }
      }
      if (status == "0") {
        res.json({ status: "fail", message: "account_not_active" });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.post('/transfer', async function (req, res) {
  var from = req.body.from;
  var to = req.body.to;
  var amount = req.body.amount;
  var getFromDetail = await Wallet.findOne({ 'coin_id': from }).exec();
  var getToDetail = await Wallet.findOne({ 'coin_id': to }).exec();
  if (getFromDetail.amount < amount) {
    res.json({ status: "fail", message: "insufficient_balance" });
    return;
  }

  console.log(getToDetail);
  let fromBalance = getFromDetail.amount - amount;
  let toBalance = getToDetail.amount + amount;

  console.log(toBalance);
  await Wallet.findOneAndUpdate({ coin_id: getFromDetail._id }, { amount: fromBalance });
  await Wallet.findOneAndUpdate({ coin_id: getToDetail._id }, { amount: toBalance });

  res.json({ status: "success", data: { from: fromBalance, to: toBalance } });

});

route.all("/register", upload.none(), (req, res) => {
  var emailUnique = "true";
  var phoneUnique = "true";
  var refStatus = "false";
  var reffer = req.body.reffer;
  if (reffer) {
    refStatus = "yes";
  } else {
    refStatus = "no";
  }
  const newUser = new User({
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    country_code: req.body.country_code,
    phone_number: req.body.phone_number,
    birthday: req.body.birthday,
    birth_place: req.body.birth_place,
    city: req.body.city,
    country: req.body.country,
    address: req.body.address,
    id_type: req.body.id_type,
    id_number: req.body.id_number,
    password: utilities.hashData(req.body.password),
    api_key_result: req.body.api_key,
  });

  async function uniqueChecker() {
    let emailC = await User.findOne({ email: req.body.email }).exec();
    if (emailC != null) {
      emailUnique = "false";
    }
    let phoneC = await User.findOne({
      phone_number: req.body.phone_number,
    }).exec();
    if (phoneC != null) {
      phoneUnique = "false";
    }
  }

  async function register() {
    if (emailUnique == "true" && phoneUnique == "true") {
      let usr = await newUser.save();

      if (refStatus == "yes") {
        let user = await UserRef.findOne({ refCode: reffer }).exec();

        if (user != null) {
          var newReferral = new Referral({
            user_id: usr._id,
            reffer: reffer,
          });
          newReferral.save();
        } else {
          res.json({ status: "fail", message: "referral_not_found" });
        }
      }
      var regUserId = usr._id;
      // make unique control
      var refCode = utilities.makeId(10);
      const newRef = new UserRef({
        user_id: regUserId,
        refCode: refCode,
      });
      await newRef.save();
      res.json({ status: "success", data: newRef });
    } else {
      var uniqueArray = [];
      uniqueArray.push({
        emailUnique: emailUnique,
        phoneUnique: phoneUnique,
        response: "not_unique",
      });
      res.json({ status: "fail", message: uniqueArray[0] });
    }
  }

  const uniqueCheck = async () => {
    uniqueChecker();
    await delay(1000); // Delay 2s
    register();
  };

  uniqueCheck();
});

route.all("/addCoin", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;

  const newCoin = new CoinList({
    name: req.body.name,
    symbol: req.body.symbol,
    network: req.body.network,
    contract_address: req.body.contract_address,
    image_url: req.body.image_url,
  });

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    newCoin.save();
    res.json({ status: "success", data: result });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.post('/getMarginOrders', async function (req, res) {
  var api_key_result = req.body.api_key;
  console.log(req.body);
  let result = await authFile.apiKeyChecker(api_key_result);
  if (result !== true) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }

  let orders = await MarginOrder.find({ user_id: req.body.user_id }).exec();

  res.json({ status: "success", data: orders });
});
route.post('/closeMarginOrder', async function (req, res) {
  try {

    var api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result !== true) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }
    let orderId = req.body.order_id ?? null;
    if (orderId == null) {
      res.json({ status: "fail", message: "invalid_order" });
      return;
    }

    console.log("Order : ", orderId);
    var urlPair = req.body.pair_name.replace("/", "");
    let url =
      'https://api.binance.com/api/v3/ticker/price?symbols=["' + urlPair + '"]';
    result = await axios(url);
    var price = result.data[0].price;
    MarginOrder.findOneAndUpdate({ _id: new ObjectId(orderId) }, { $set: { status: 1, close_time: Date.now(), close_price: price } }, function (err, doc) {
      if (err) {
        res.json({ status: "fail", message: err.message });
        return;
      }
      res.json({ status: "success", data: doc });
    })

  } catch (err) {

  }
});
route.post('/addMarginOrder', async function (req, res) {
  try {
    const MarginWalletId = "62ff3c742bebf06a81be98fd";
    var api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result !== true) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }
    if (req.body.amount <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return;
    }

    let userBalance = await Wallet.findOne({ coin_id: MarginWalletId, user_id: req.body.user_id }).exec();
    if (userBalance.amount <= 0) {
      res.json({ status: "fail", message: "invalid_balance" });
      return;
    }
    var urlPair = req.body.pair_name.replace("/", "");
    let url =
      'https://api.binance.com/api/v3/ticker/price?symbols=["' + urlPair + '"]';
    console.log(url);
    result = await axios(url);
    var price = result.data[0].price;
    //let total = price * req.body.amount;
    let imr = 1 / req.body.leverage;
    let initialMargin = req.body.amount * price * imr;
    if (userBalance.amount <= initialMargin) {
      res.json({ status: "fail", message: "Invalid balance. Required margin : " + initialMargin });
      return;
    }
    let order = new MarginOrder({
      pair_id: req.body.pair_id,
      pair_name: req.body.pair_name,
      type: req.body.type,
      user_id: req.body.user_id,
      sl: req.body.sl ?? 0,
      tp: req.body.tp ?? 0,
      leverage: req.body.leverage,
      amount: req.body.amount,
      open_price: price,

    });

    order.save();

    console.log(order);
    res.json({ status: "success", data: order });
  } catch (err) {
    res.json({ status: "fail", message: err.message });
  }
});

route.post('/withdraw',  async function(req,res) {
  console.log(req.body);
  var user_id = req.body.user_id;
  var wallet_id = req.body.wallet_id;
  var to = req.body.to;
  var amount = parseFloat(req.body.amount);
  var api_key_result = req.body.api_key;
  /*
  var api_result = await authFile.apiKeyChecker(api_key_result);
  if (api_result === false) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }
  */
  var fromWalelt = await Wallet.findOne({ _id: wallet_id, user_id : user_id }).exec();
  console.log(fromWalelt);
  let balance = parseFloat(fromWalelt.amount);
  
  if(amount <= 0) {
    res.json({ status: "fail", message: "invalid_amount" });
    return;
  } 
  
  if(balance <= amount) {
    res.json({ status: "fail", message: "invalid_balance" });
    return;
  } 


  let data = new Withdraws({
    user_id : user_id,
    coin_id : fromWalelt.coin_id,
    amount: amount,
    to : to,
    fee: 0.00,
     
  });

  await data.save();
  fromWalelt.amount = parseFloat(fromWalelt.amount) - parseFloat(amount);
  await fromWalelt.save();
  res.json({ status: "success", data: data });

  /*
    var getPair = await CoinList.findOne({_id: fromWalelt.coin_id }).exec();  
  switch(getPair.name) {
    case "BTC" : 
    let post = await axios.post('htpp://3.15.2.155', {'request' : 'transfer', 'to' : to, 'amount' : amount});
    console.log(post);
    break;
  }
*/
});

route.all("/addOrders", upload.none(), async function (req, res) {
  try {
    var api_key_result = req.body.api_key;

    let api_result = await authFile.apiKeyChecker(api_key_result);
    if (api_result === false) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }

    let amount = parseFloat(parseFloat(req.body.amount) * 1.0);
    
    var getPair = await Pairs.findOne({ name: req.body.pair_name }).exec();
    var fromWalelt = await Wallet.findOne({ coin_id: getPair.symbolOneID, user_id:req.body.user_id }).exec();
    var toWalelt = await Wallet.findOne({ coin_id: getPair.symbolTwoID, user_id:req.body.user_id }).exec();
    console.log("Amount : ", amount);
    console.log("From Pair : ", getPair);



    console.log("From Wallet : ", fromWalelt);
    console.log("To Wallet : ", toWalelt);
    if(amount <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return; 
    }

    console.log(toWalelt.amount);
    if(toWalelt.amount <= 0) {
      res.json({ status: "fail", message: "invalid_balance" });
      return; 
    }

    var urlPair = req.body.pair_name.replace("/", "");
    let url =
      'https://api.binance.com/api/v3/ticker/price?symbols=["' + urlPair + '"]';
    console.log(url);
    let result = await axios(url);
    var price = parseFloat(result.data[0].price);
    let target_price = 0.0;
    var coins = req.body.pair_name.split('/');
    

    
    if (req.body.method == 'buy') {
      if (req.body.type == 'limit') {
        target_price = req.body.target_price;
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: parseFloat(amount),
          open_price: target_price,
          type: "limit",
          method: "buy",
          target_price: req.body.target_price,
        });
        
        let saved = await orders.save();
        res.json({ status: "success", message: saved });

      } else if (req.body.type == 'market') {
        let total = (amount * price);
        let balance = (parseFloat(toWalelt.amount) * 1.0);
        console.log("Total : ", total, " balance : ", balance);
        if(balance >= total) {
          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: parseFloat(amount),
            open_price: price,
            type: "market",
            method: "buy",
            target_price: req.body.target_price,
          });
          
          let saved = await orders.save();
          if(saved) {
            fromWalelt.amount = parseFloat(fromWalelt.amount) + parseFloat(amount);
            toWalelt.amount = parseFloat(toWalelt.amount) -  parseFloat(total);
            await fromWalelt.save();  
            await toWalelt.save();
            res.json({ status: "success", message: saved });
          }
          
        } else {
          res.json({ status: "fail", message: "not_enougth_balance" });
        }
      }
    }


    if (req.body.method == 'sell') {
      if (req.body.type == 'limit') {
        target_price = req.body.target_price;
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: parseFloat(amount),
          open_price: target_price,
          type: "limit",
          method: "sell",
          target_price: req.body.target_price,
        });
        
        let saved = await orders.save();
        res.json({ status: "success", message: saved });

      } else if (req.body.type == 'market') {
        let balance = parseFloat(fromWalelt.amount);
        console.log("Balance : ", balance);
        if(balance >= amount) {
          let total = parseFloat(amount) * parseFloat(price);
          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: parseFloat(amount),
            open_price: target_price,
            type: "market",
            method: "sell",
            target_price: req.body.target_price,
          });

          let saved = await orders.save();
          if(saved) {
            fromWalelt.amount = parseFloat(fromWalelt.amount) - parseFloat(amount);
            toWalelt.amount = parseFloat(toWalelt.amount) + parseFloat(total);
            await fromWalelt.save();  
            await toWalelt.save();
            res.json({ status: "success", message: saved });
          }
        } else {
          res.json({ status: "fail", message: "invalid_balance" });
        }
      }
    }


    if (req.body.amount <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
    }

  } catch (err) {
    console.log(err);
    res.json({ status: "fail", message: "unknow_error" });
  }
});

route.all("/addNotification", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const newNotification = new Notification({
      notificationTitle: req.body.notificationTitle,
      notificationMessage: req.body.notificationMessage,
    });
    let notifications = await newNotification.save();

    let tokens = await NotificationTokens.find({}).exec();
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i].token_id;
      notifications.sendPushNotification(
        token,
        notification.notificationMessage
      );
    }
    res.json({ status: "success", data: "" });
  }
});

route.all("/getNotification", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;
  var readStatus = "unread";

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var myArray = new Array();
    let notification = await Notification.find({})
      .sort({ createdAt: -1 })
      .exec();
    for (var i = 0; i < notification.length; i++) {
      var messageId = notification[i].id;
      var messageTitle = notification[i].notificationTitle;
      var messageMessage = notification[i].notificationMessage;
      var createdAt = notification[i].createdAt;
      var messageDate = notification[i].createdAt;
      let readNotification = await ReadNotification.findOne({
        user_id: user_id,
        notification_id: messageId,
      }).exec();

      if (readNotification == null) {
        readStatus = "unread";
      } else {
        readStatus = "read";
      }
      var message = {
        messageId: messageId,
        createdAt: createdAt,
        messageTitle: messageTitle,
        messageMessage: messageMessage,
        messageDate: messageDate,
        readStatus: readStatus,
      };
      myArray.push(message);
    }
    if (notification.length == 0) {
      res.json({ status: "fail", message: "no_notification" });
    } else {
      res.json({ status: "success", data: myArray });
    }
  }
});

route.all("/getOrders", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let list = await Orders.find({
      user_id: req.body.user_id,
      type: "Limit",
      status: "0",
    })
      .sort({ createdAt: -1 })
      .exec();
    console.log(list);
    res.json({ status: "success", data: list });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.all("/getUSDTBalance", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var list = await Wallet.findOne({
      user_id: req.body.user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).exec();
    console.log(list);
    res.json({ status: "success", data: list.amount });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.all("/getPairs", upload.none(), async function (req, res) {
  var list = await Pairs.find({ status: 1 }).exec();
  res.json({ status: "success", data: list });
});

route.all("/addPair", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const newPair = new Pairs({
      name: req.body.name,
      symbolOne: req.body.symbolOne,
      symbolTwo: req.body.symbolTwo,
      digits: req.body.digits,
      type: req.body.type,
      symbolOneID: req.body.symbolOneID,
      symbolTwoID: req.body.symbolTwoID,
    });

    newPair.save();
    res.json({ status: "success", data: "" });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.all("/getDigits", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  var pairName = req.body.pairName;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var list = await Pairs.findOne(
      { name: pairName },
      { digits: 1, _id: 1 }
    ).exec();
    res.json({ status: "success", data: list });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.all("/getCoinList", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var coins = await CoinList.find({}).exec();

    console.log(coins.length);
    let amounst = await Wallet.find({ user_id: user_id });
    let result = await parseCoins(coins, amounst);
    res.json({ status: "success", data: result });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.all("/getCoinInfo", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    CoinList.findOne({ coin_id: req.body.coin_id })
      .then((coins) => {
        res.json({ status: "success", data: coins });
      })
      .catch((err) => {
        res.json({ status: "fail", message: err });
      });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.all("/getReferral", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;
  var refCode = req.body.refCode;
  var results = [];
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var ref_user = await Referral.find({ reffer: refCode }).exec();

    if (ref_user != null) {
      for (let i = 0; i < ref_user.length; i++) {
        var user_table = await User.find({
          user_id: ref_user[i].user_id,
        });
      }
      var result = await parseUsers(ref_user, user_table);

      console.log(result);
      res.json({ status: "success", data: result });
    } else {
      res.json({ status: "fail", message: "not_found" });
    }
  }
});

route.all("/getWallet", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var _wallets = await Wallet.find({ user_id: req.body.user_id }).exec();
    var wallets = new Array;
    for(var i = 0; i < _wallets.length; i++) {
      let item =  _wallets[i];
      console.log(item);
      let pairInfo = await Pairs.findOne({symbolOneID: item.coin_id}).exec();
      if(pairInfo == null) continue;
      console.log(pairInfo);
      wallets.push({'id' : item._id, 'coin_id' : item.coin_id, 'balance' : item.amount, 
      'address' : item.address, 'symbolName' : pairInfo.name});
      
    }
    console.log(wallets);
    res.json({ status: "success", data: wallets });
  } else {
    res.json({ status: "fail", message: "not_found" });
  }
});

route.all("/2fa", upload.none(), async function (req, res) {
  var twofapin = req.body.twofapin;
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var wantToTrust = req.body.wantToTrust;
  var log_id = req.body.log_id;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var user = await User.findOne({
      _id: user_id,
    }).exec();

    if (user != null) {
      var twofa = user["twofa"];

      var result2 = await authFile.verifyToken(twofapin, twofa);

      if (result2 === true) {
        if (wantToTrust == "yes") {
          var update = { trust: "yes" };
          var log = await LoginLogs.findOneAndUpdate(
            { _id: log_id },
            update
          ).exec();
          res.json({ status: "success", data: "2fa_success" });
        } else {
          res.json({ status: "success", message: "2fa_success" });
        }
      } else {
        res.json({ status: "fail", message: "2fa_failed" });
      }
    } else {
      res.json({ status: "fail", message: "login_failed" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/update2fa", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var twofa = req.body.twofa;
  var twofapin = req.body.twofapin;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const filter = { _id: user_id };
    const update = { twofa: twofa };

    var result2 = await authFile.verifyToken(twofapin, twofa);

    if (result2 === true) {
      User.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          console.log(err);
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "2fa_updated" });
        }
      });
    } else {
      res.json({ status: "fail", message: "wrong_auth_pin" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/cancelOrder", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var order_id = req.body.order_id;
  var pair_id = req.body.pair_id;

  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const filter = { user_id: user_id, _id: order_id };
    const update = { status: "2" };
    var pair = await Pairs.findOne({ id: pair_id }).exec();

    if (pair != null) {
      var symbolTwoID = pair.symbolTwoID;
      var symbolOneID = pair.symbolOneID;

      var wallet = await Wallet.findOne({
        user_id: user_id,
        coin_id: symbolTwoID,
      }).exec();

      if (wallet != null) {
        var balance = wallet.amount;
        let order = await Orders.findOne(filter).exec();

        if (order != null) {
          var priceAmount = order.priceAmount;
          var newBalance = parseFloat(balance) + parseFloat(priceAmount);
          var update2 = { amount: newBalance };
          Wallet.findOneAndUpdate(
            { user_id: user_id, coin_id: symbolTwoID },
            update2,
            (err, doc) => {
              if (err) {
                console.log(err);
                res.json({ status: "fail", message: error });
              } else {
                Orders.findOneAndUpdate(filter, update, (err, doc) => {
                  if (err) {
                    console.log(err);
                    res.json({ status: "fail", message: err });
                  } else {
                    res.json({ status: "success", data: "cancelled" });
                  }
                });
              }
            }
          );
        } else {
          res.json({ status: "fail", message: "pair_not_found" });
        }
      }
    } else {
      res.json({ status: "fail", message: "wallet_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/addSecurityKey", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = utilities.hashData(req.body.security_key);
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var securityKey = await SecurityKey.findOne({
      user_id: user_id,
      status: 1,
    }).exec();

    if (securityKey != null) {
      res.json({ status: "success", data: "secury_key_active" });
    } else {
      var newSecurityKey = new SecurityKey({
        user_id: user_id,
        key: security_key,
        status: 1,
        trade: trade,
        wallet: wallet,
        deposit: deposit,
        withdraw: withdraw,
      });
      newSecurityKey.save((err, doc) => {
        if (err) {
          console.log(err);
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "" });
        }
      });
    }
  }
});



route.all("/updateSecurityKey", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = req.body.security_key;
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var securityKey = await SecurityKey.findOne({
      user_id: user_id,
      status: 1,
      id: req.body.id,
    }).exec();

    if (securityKey != null) {
      const filter = { id: req.body.id, status: 1 };
      const update = {
        wallet: wallet,
        deposit: deposit,
        withdraw: withdraw,
        trade: trade,
      };
      SecurityKey.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          console.log(err);
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "update_success" });
        }
      });
    } else {
      res.json({ status: "fail", message: "security_key_not_found" });
    }
  }
});

route.all("/lastActivities", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var limit = req.body.limit;
  authFile.apiKeyChecker(api_key_result).then(async function (result) {
    if (result === true) {
      if (limit <= 100) {
        var sort = { createdAt: -1 };
        var logs = await LoginLogs.find({ user_id: user_id })
          .sort(sort)
          .limit(limit)
          .exec();
        res.json({ status: "success", data: logs });
      } else {
        res.json({ status: "success", data: "max_limit_100" });
      }
    }
  });
});

route.all("/updatePhone", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var newCountryCode = req.body.country_code;
  var newPhoneNumber = req.body.phone_number;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    console.log("UserID : " + user_id);
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var twofa = user["twofa"];
      const filter = { _id: user_id, status: 1 };
      let result2 = await authFile.verifyToken(twofapin, twofa);
      if (result2 === true) {
        const update = {
          country_code: newCountryCode,
          phone_number: newPhoneNumber,
        };
        let doc = await User.findOneAndUpdate(filter, update).exec();

        res.json({ status: "success", data: "update_success" });
      } else {
        res.json({ status: "fail", message: "2fa_failed" });
      }
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/resetPassword", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var password = req.body.password;

  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var twofa = user["twofa"];
      const filter = { _id: user_id, status: 1 };
      let result2 = await authFile.verifyToken(twofapin, twofa);

      if (result2 === true) {
        const update = { password: utilities.hashData(password) };
        User.findOneAndUpdate(filter, update, (err, doc) => {
          if (err) {
            console.log(err);
            res.json({ status: "fail", message: err });
          } else {
            res.json({ status: "succes", message: "update_success" });
          }
        });
      } else {
        res.json({ status: "fail", message: "2fa_failed" });
      }
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/changePassword", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var password = req.body.password;
  var old_password = req.body.old_password;

  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var twofa = user["twofa"];
      var db_password = user["password"];
      const filter = { _id: user_id, status: 1 };
      if (utilities.hashData(old_password) == db_password) {
        let result2 = await authFile.verifyToken(twofapin, twofa);

        if (result2 === true) {
          const update = { password: utilities.hashData(password) };
          User.findOneAndUpdate(filter, update, (err, doc) => {
            if (err) {
              console.log(err);
              res.json({ status: "fail", message: err });
            } else {
              res.json({ status: "success", data: "update_success" });
            }
          });
        } else {
          res.json({ status: "fail", message: "2fa_failed" });
        }
      } else {
        res.json({ status: "fail", message: "wrong_old_password" });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/get2fa", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var formattedKey = authenticator.generateKey();
    res.json({ status: "success", data: formattedKey });
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/getUserInfo", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  console.log(user_id);

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
    }).exec();

    if (user != null) {
      var twofaStatus = user["twofa"];

      var status = user["status"];

      if (status == 1) {
        res.json({
          status: "success",
          data: {
            name: user["name"],
            surname: user["surname"],
            email: user["email"],
            country_code: user["country_code"],
            phone_number: user["phone_number"],
          },
        });
      }

      if (status == 0) {
        res.json({ status: "fail", message: "account_not_activated" });
      }
    } else {
      res.json({ status: "fail", message: "login_failed" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/getUserId", upload.none(), async function (req, res) {
  var email = req.body.email;
  var api_key_result = req.body.api_key;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      User.findOne({
        email: email,
      })
        .then((user) => {
          if (user != null) {
            var myArray = [];
            myArray.push({
              response: "success",
              user_id: user["id"],
            });
            res.json({ status: "success", data: myArray });
          } else {
            res.json({ status: "fail", message: "user_not_found" });
          }
        })
        .catch((err) => {
          res.json({ status: "fail", message: err });
        });
    } else {
      res.json({ status: "fail", message: "403 Forbidden" });
    }
  });
});

route.all("/getSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      SecurityKey.findOne({
        user_id: user_id,
        status: 1,
      }).then((securityKey) => {
        if (securityKey != null) {
          res.json({
            status: "success",
            data: {
              response: "success",
              createdAt: securityKey["createdAt"],
              wallet: securityKey["wallet"],
              trade: securityKey["trade"],
              deposit: securityKey["deposit"],
              withdraw: securityKey["withdraw"],
              id: securityKey["id"],
            },
          });
        } else {
          res.json({ status: "fail", message: "security_key_not_active" });
        }
      });
    }
  });
});

route.all("/checkSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      SecurityKey.findOne({
        user_id: user_id,
        status: 1,
        key: utilities.hashData(req.body.key),
      }).then((securityKey) => {
        if (securityKey != null) {
          res.json({ status: "success", data: "" });
        } else {
          res.json({ status: "fail", message: "wrong_key" });
        }
      });
    }
  });
});

route.all("/deleteSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var twofapin = req.body.twofapin;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      User.findOne({
        _id: user_id,
      }).then((user) => {
        if (user != null) {
          var twofa = user["twofa"];

          authFile.verifyToken(twofapin, twofa).then((result2) => {
            if (result2 === true) {
              SecurityKey.findOneAndUpdate(
                { user_id: user_id, id: req.body.key_id },
                { status: 0 },
                (err, doc) => {
                  if (err) {
                    console.log(err);
                    res.json({ status: "fail", message: err });
                  } else {
                    res.json({ status: "success", data: "" });
                  }
                }
              );
            } else {
              res.json({ status: "fail", message: "2fa_failed" });
            }
          });
        }
      });
    } else {
      res.json({ status: "fail", message: "403 Forbidden" });
    }
  });
});

route.all("/addWithdraw", upload.none(), (req, res) => {
  console.log("asd");
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var amount = req.body.amount;
  var currency = req.body.currency;
  var withdraw_address = req.body.withdraw_address;
  var coin_id = req.body.coin_id;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      Wallet.findOne({ user_id: user_id, coin_id: coin_id }, { amount: 1 })
        .then((list) => {
          if (parseFloat(list.amount) >= parseFloat(amount)) {
            const newWithdraw = new Withdraws({
              user_id: user_id,
              coin_id: coin_id,
              amount: amount,
              withdraw_address: withdraw_address,
              status: 1,
            });
            NotificationTokens.findOne({
              user_id: user_id,
            }).then((response) => {
              if (response == null) {
              } else {
                console.log(response);
                var token = response["token_id"];
                newWithdraw.save(function (err, room) {
                  if (err) {
                    console.log(token);
                    res.json({ status: "fail", message: err });
                  } else {
                    var body =
                      "A withdraw order has been given from your account. Please wait for the admin to confirm your order.\n\n";
                    notifications.sendPushNotification(token, body);
                    res.json({ status: "success", data: "" });
                  }
                });
              }
            });
          } else {
            res.json({ status: "fail", message: "not_enough_balance" });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.json({ status: "fail", message: "403 Forbidden" });
    }
  });
});

route.all("/getDepositsUSDT", upload.none(), (req, res) => {
  var coin_id = "62bc116eb65b02b777c97b3d";
  var user_id = "62a89a7bebd4b6fca58d18a0";
  var amount = 10;
  var address = "THPvaUhoh2Qn2y9THCZML3H815hhFhn5YC";
  var txid = "253f666b515d1668a7e0088130732ea1c2336825aa92638c2c8b88a9e66f2ab3";

  //find deposits here, then call addDeposit Function in while loop.
  CoinList.findOne({
    coin_id: coin_id,
  }).then((coin) => {
    if (coin != null) {
      var coin_symbol = coin["symbol"];
      utilities.addDeposit(user_id, coin_symbol, amount, address, txid);
    }
  });
  res.json({ status: "success", data: "" });
});

route.listen(port, () => {
  console.log("Server Ayakta");
});

