"use strict";
var authenticator = require("authenticator");
const User = require("./models/Test");
const Wallet = require("./models/Wallet");
const CoinList = require("./models/CoinList");
const Referral = require("./models/Referral");
const RegisterMail = require("./models/RegisterMail");
const RegisterSMS = require("./models/RegisterSMS");
const UserRef = require("./models/UserRef");
const Pairs = require("./models/Pairs");
const Orders = require("./models/Orders");
const LoginLogs = require("./models/LoginLogs");
const SecurityKey = require("./models/SecurityKey");
const Notification = require("./models/Notifications");
const ReadNotification = require("./models/ReadNotifications");
const SMSVerification = require("./models/SMSVerification");
const MailVerification = require("./models/MailVerification");
const CopyLeaderRequest = require("./models/CopyTradeLeaderRequest");
const axios = require("axios");
const NotificationTokens = require("./models/NotificationTokens");
const Withdraws = require("./models/Withdraw");
const RegisteredAddress = require("./models/RegisteredAddress");
var authFile = require("./auth.js");
var notifications = require("./notifications.js");
var utilities = require("./utilities.js");
var mailer = require("./mailer.js");

var CopyTrade = require("./CopyTrade.js");
const CopyTradeModel = require("./models/CopyTrade");
const Connection = require("./Connection");
require("dotenv").config();

//var formattedKey = authenticator.generateKey();
//var formattedToken = authenticator.generateToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse");
//console.log(authenticator.verifyToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse", "260180"));
//console.log(formattedToken);

Connection.connection();

const MarginWalletId = "62ff3c742bebf06a81be98fd";
const express = require("express");
var route = express();

const delay = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};
const { createHash, randomBytes } = require("crypto");

var cors = require("cors");
route.use(cors());

var port = process.env.PORT;
var bodyParser = require("body-parser");

const multer = require("multer");
const { Console } = require("console");
const { exit } = require("process");
const auth = require("./auth.js");
const MarginOrder = require("./models/MarginOrder");
const MarginWallet = require("./models/MarginWallet");
const { ObjectId } = require("mongodb");
const Subscription = require("./models/Subscription");
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
      a.name = user_table.filter((amount) => amount._id == a.user_id)["name"];
      a.surname = user_table.filter((amount) => amount._id == a.user_id)[
        "surname"
      ];

      parsedUsers.push(a);
    }

    resolve(parsedUsers);
  });
}

route.post("/subscription", async (req, res) => {
  try {
    if (
      req.body.email == null ||
      req.body.email == "undefined" ||
      req.body.email == ""
    ) {
      res.json({ status: "fail", code: 1 });
    }
    let item = new Subscription();
    item.email = req.body.email;
    await item.save();
    res.json({ status: "success" });
  } catch (err) {
    res.json({ status: "fail", code: 2 });
  }
});

route.all("/login", upload.none(), async (req, res) => {
  console.log("Loginstart");
  let newRegisteredId;
  var api_key_result = req.body.api_key;
  var deviceName = "null";
  var deviceToken = "null";
  var deviceType = "null";
  var manufacturer = "null";
  var ip = req.body.ip;
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
  } else {
    ip = "null";
  }

  var notificationToken = req.body.notificationToken;
  let result = await authFile.apiKeyChecker(api_key_result);

  console.log(searchType);
  if (result === true) {
    console.log(req.body.user);
    console.log(utilities.hashData(req.body.password));
    let user = await User.findOne({
      [searchType]: req.body.user,
      password: utilities.hashData(req.body.password),
    }).exec();

    console.log(user);

    if (user != null) {
      let emailVerifyCheck = await RegisterMail.findOne({
        email: user.email,
        status: "1",
      });

      let smsVerifyCheck = await RegisterSMS.findOne({
        phone_number: user.phone_number,
        status: "1",
      });

      let emailVerifyExist = "";
      let smsVerifyExist = "";

      if (emailVerifyCheck != null) {
        emailVerifyExist = "yes";
      } else {
        emailVerifyExist = "no";
      }

      if (smsVerifyCheck != null) {
        smsVerifyExist = "yes";
      } else {
        smsVerifyExist = "no";
      }

      var twofaStatus = user["twofa"];
      var results = [];
      var refId = "";
      let userRef = await UserRef.findOne({
        user_id: user._id,
      }).exec();
      if (userRef != null) refId = userRef["refCode"] ?? "";
      else refId = "";
      var data = {
        response: "success",
        email: user.email,
        twofa: twofaStatus,
        emailVerify: emailVerifyExist,
        smsVerify: smsVerifyExist,
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
          let privateKey = "";
          let address = "";

          if (walletResult === null) {
            if (coins[i].symbol === "ETH") {
              console.log("Start ETH");
              let url = "http://34.239.168.239:4455/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }

            if (coins[i].symbol === "BNB") {
              console.log("Start BNB");
              let url = "http://44.203.2.70:4458/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }

            if (coins[i].symbol === "USDT") {
              console.log("Start USDT");
              let url = "http://54.172.40.148:4456/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address.base58;
            }

            if (coins[i].symbol === "Margin") {
              console.log("Start Margin");
              let getUsdtWalelt = await Wallet.find({ symbol: "USDT" }).exec();

              privateKey = getUsdtWalelt.privateKey;
              address = getUsdtWalelt.address;
            }

            if (coins[i].symbol === "BTC") {
              console.log("Start BTC");
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
          } else {
            console.log("Cüzdan var");
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
          }
        }

        let logs = await LoginLogs.find({
          user_id: user["_id"],
          ip: ip,
          deviceName: deviceName,
          manufacturer: manufacturer,
          model: deviceModel,
        })
          .sort({ $natural: -1 })
          .limit(1)
          .exec();

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
                throw err;
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

route.all("/topReferrals", async (req, res) => {
  let api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result == true) {
    let referrals = await Referral.find({}).exec();
    let data = [];
    for (let i = 0; i < referrals.length; i++) {
      console.log(referrals[i]);

      console.log(referrals[i].reffer);
      let refCount = await Referral.find({
        reffer: referrals[i].reffer,
      }).exec();

      console.log("count: " + refCount.length);
      data.push({
        refCode: referrals[i].reffer,
        refCount: refCount.length,
      });
    }

    function removeDuplicates(originalArray, prop) {
      var newArray = [];
      var lookupObject = {};

      for (var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
      }

      for (i in lookupObject) {
        newArray.push(lookupObject[i]);
      }
      return newArray;
    }

    res.json({ status: "success", data: removeDuplicates(data, "refCode") });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.post("/transfer", async function (req, res) {
  var from = req.body.from;
  var to = req.body.to;
  var amount = req.body.amount;
  var getFromDetail = await Wallet.findOne({ coin_id: from }).exec();
  var getToDetail = await Wallet.findOne({ coin_id: to }).exec();
  if (getFromDetail.amount < amount) {
    res.json({ status: "fail", message: "insufficient_balance" });
    return;
  }

  let fromBalance = getFromDetail.amount - amount;
  let toBalance = getToDetail.amount + amount;

  await Wallet.findOneAndUpdate(
    { coin_id: getFromDetail._id },
    { amount: fromBalance }
  );
  await Wallet.findOneAndUpdate(
    { coin_id: getToDetail._id },
    { amount: toBalance }
  );

  res.json({ status: "success", data: { from: fromBalance, to: toBalance } });
});

//register
route.all("/sendMailPin", async function (req, res) {
  var api_key_result = req.body.api_key;
  var email = req.body.email;
  let result = await authFile.apiKeyChecker(api_key_result);

  console.log(result);
  if (result === true) {
    var pin = Math.floor(100000 + Math.random() * 900000);

    const newPin = new RegisterMail({
      email: email,
      pin: pin,
    });

    let mailCheck = await RegisterMail.findOne({ email: email }).exec();
    if (mailCheck == null) {
      if (newPin.save()) {
        mailer.sendMail(email, "Pin Code", "Your pin code is " + pin + ".");
        res.json({ status: "success", message: "pin_sent" });
      } else {
        res.json({ status: "fail", message: "an_error_occured" });
      }
    } else {
      RegisterMail.findOneAndUpdate(
        { email: email },
        { pin: pin },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            mailer.sendMail(email, "Pin Code", "Your pin code is " + pin + ".");
            res.json({ status: "success", message: "pin_sent" });
          }
        }
      );
    }
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

//register
route.all("/sendSMSPin", async function (req, res) {
  var api_key_result = req.body.api_key;
  var phone = req.body.phone;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var pin = Math.floor(100000 + Math.random() * 900000);

    const newPin = new RegisterSMS({
      phone_number: phone,
      pin: pin,
    });

    let smsCheck = await RegisterSMS.findOne({ phone: phone }).exec();
    if (smsCheck == null) {
      if (newPin.save()) {
        mailer.sendSMS(phone, "Your pin code is " + pin + ".");
        res.json({ status: "success", message: "pin_sent" });
      } else {
        res.json({ status: "fail", message: "an_error_occured" });
      }
    } else {
      RegisterSMS.findOneAndUpdate(
        { phone_number: phone },
        { phone_number: phone },
        { pin: pin },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            mailer.sendSMS(phone, "Your pin code is " + pin + ".");
            res.json({ status: "success", message: "pin_sent" });
          }
        }
      );
    }
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.all("/register", upload.none(), async (req, res) => {
  var registerType = req.body.registerType;
  var data = req.body.data;
  var pin = req.body.pin;

  var emailUnique = "true";
  var phoneUnique = "true";
  var refStatus = "false";
  var reffer = req.body.reffer;
  if (reffer) {
    refStatus = "yes";
  } else {
    refStatus = "no";
  }

  let newUser;

  if (registerType == "email") {
    let checkEmailPin = await RegisterMail.findOne({
      email: data,
      pin: pin,
    }).exec();

    if (checkEmailPin == null) {
      res.json({ status: "fail", message: "pin_not_match" });
      return;
    } else {
      RegisterMail.findOneAndUpdate(
        { email: data },
        { status: "1" },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            console.log("pin status updated");
          }
        }
      );
    }
  }

  if (registerType == "phone") {
    let checkPhonePin = await RegisterSMS.findOne({
      phone: data,
      pin: pin,
    }).exec();

    if (checkPhonePin == null) {
      res.json({ status: "fail", message: "pin_not_match" });
      return;
    } else {
      RegisterSMS.findOneAndUpdate(
        { phone: data },
        { status: "1" },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            console.log("pin status updated");
          }
        }
      );
    }
  }

  async function uniqueChecker() {
    if (registerType == "email") {
      let emailC = await User.findOne({ email: req.body.data }).exec();
      if (emailC != null) {
        emailUnique = "false";
      }
    } else {
      let phoneC = await User.findOne({
        phone_number: req.body.data,
      }).exec();
      console.log(phoneC);
      if (phoneC != null) {
        phoneUnique = "false";
      }
    }
  }

  async function register() {
    if (emailUnique == "true" && phoneUnique == "true") {
      if (registerType == "email") {
        newUser = new User({
          email: data,
          password: utilities.hashData(req.body.password),
          api_key_result: req.body.api_key,
          status: 1,
        });
      } else {
        newUser = new User({
          country_code: "90",
          phone_number: req.body.data,
          password: utilities.hashData(req.body.password),
          api_key_result: req.body.api_key,
          status: 1,
        });
      }
      console.log("Bura 1");
      let usr = await newUser.save();
      console.log("Bura 2");
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

  uniqueChecker().then(() => {
    register();
  });
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

route.all("/CopyLeaderRequest", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  let checkLeader = await CopyLeaderRequest.findOne({
    user_id: req.body.user_id,
  }).exec();

  const newLeaderRequest = new CopyLeaderRequest({
    user_id: req.body.user_id,
  });

  if (result === true) {
    if (checkLeader == null) {
      newLeaderRequest.save();
      res.json({ status: "success", data: null });
    } else {
      res.json({ status: "fail", message: "already_requested" });
    }
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
});

route.post("/getClosedMarginOrders", async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);
  if (result !== true) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }

  let orders = await MarginOrder.find({
    user_id: req.body.user_id,
    status: 1,
  }).exec();

  res.json({ status: "success", data: orders });
});

route.post("/getOpenMarginOrders", async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);
  if (result !== true) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }

  let orders = await MarginOrder.find({
    user_id: req.body.user_id,
    status: 0,
  }).exec();

  res.json({ status: "success", data: orders });
});

route.post("/closeMarginOrder", async function (req, res) {
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
    console.log("1");
    let getOrderDetail = await MarginOrder.findOne({ _id: orderId }).exec();
    let getPair = await Pairs.findOne({ _id: getOrderDetail.pair_id }).exec();
    var urlPair = getPair.name.replace("/", "");
    let url =
      'https://api.binance.com/api/v3/ticker/price?symbols=["' + urlPair + '"]';
    result = await axios(url);
    var price = result.data[0].price;
    let doc = await MarginOrder.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { status: 1, close_time: Date.now(), close_price: price } }
    );
    console.log(doc);
    if (doc.status == 1) {
      res.json({ status: "fail", message: "Order is closed" });
      return;
    }
    if (doc.margin_type == "isolated") {
      let marginWallet = await Wallet.findOne({
        user_id: doc.user_id,
        coin_id: MarginWalletId,
      }).exec();
      marginWallet.amount = marginWallet.amount + (doc.pnl + doc.usedUSDT);
      await marginWallet.save();
    } else {
      let marginWallet = await Wallet.findOne({
        user_id: doc.user_id,
        coin_id: MarginWalletId,
      }).exec();

      marginWallet.pnl = marginWallet.pnl - doc.pnl;
      marginWallet.amount = marginWallet.amount + doc.pnl + doc.usedUSDT;
      await marginWallet.save();
    }

    console.log("ok");

    res.json({ status: "success", data: doc });
  } catch (err) {}
});

route.post("/addMarginOrder", async function (req, res) {
  try {
    var api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result !== true) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }

    const MarginWalletId = "62ff3c742bebf06a81be98fd";
    let margin_type = req.body.margin_type;
    let user_id = req.body.user_id;
    let symbol = req.body.symbol;
    let percent = req.body.percent;
    let amount = req.body.amount;
    let type = req.body.type;
    let method = req.body.method;
    let target_price = req.body.target_price ?? 0.0;
    let stop_limit = req.body.stop_limit ?? 0.0;
    let leverage = req.body.leverage ?? 0.0;
    if (amount <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return;
    }
    let userBalance = await Wallet.findOne({
      coin_id: MarginWalletId,
      user_id: req.body.user_id,
    }).exec();

    let getPair = await Pairs.findOne({ name: req.body.symbol }).exec();
    if (getPair == null) {
      res.json({ status: "fail", message: "invalid_pair" });
      return;
    }

    var urlPair = getPair.name.replace("/", "");
    console.log(urlPair);
    let url =
      'https://api.binance.com/api/v3/ticker/price?symbols=["' + urlPair + '"]';
    result = await axios(url);
    var price = parseFloat(result.data[0].price);
    if (margin_type == "isolated") {
      if (method == "limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({ status: "fail", message: "Please enter a greather zero" });
          return;
        }

        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        res.json({ status: "success", data: order });
        return;
      } else if (method == "stop_limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({
            status: "fail",
            message: "Limit price must be greater than 0.",
          });
          return;
        }

        if (stop_limit <= 0) {
          res.json({
            status: "fail",
            message: "Stop limit must be greater than 0.",
          });
          return;
        }

        if (type == "buy") {
          if (stop_limit > target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be greater then target price",
            });
            return;
          }

          if (price > stop_limit) {
            res.json({
              status: "fail",
              message: "Price can't be greater than stop price",
            });
            return;
          }
        }

        if (type == "sell") {
          if (stop_limit < target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be smaller then target price",
            });
            return;
          }
          if (price < stop_limit) {
            res.json({
              status: "fail",
              message: "Price can't be smaller than stop price",
            });
            return;
          }
        }

        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          stop_limit: stop_limit,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        res.json({ status: "success", data: order });
        return;
      } else if (req.body.method == "market") {
        amount =
          ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
        let usedUSDT = (amount * price) / req.body.leverage;

        let reverseOreders = await MarginOrder.findOne({
          user_id: req.body.user_id,
          pair_id: getPair._id,
          margin_type: margin_type,
          method: "market",
          status: 0,
        });

        if (reverseOreders) {
          console.log("reverse order find");
          console.log(reverseOreders);
          console.log("222");
          if (reverseOreders.leverage > leverage) {
            res.json({ status: "fail", message: "Leverage cannot be smaller" });
            return;
          }
          if (reverseOreders.type == type) {
            let oldAmount = reverseOreders.amount;
            let oldUsedUSDT = reverseOreders.usedUSDT;
            let oldPNL = reverseOreders.pnl;
            let oldLeverage = reverseOreders.leverage;
            let newUsedUSDT = oldUsedUSDT + usedUSDT + oldPNL;
            console.log(oldUsedUSDT, " | ", usedUSDT, " | ", oldPNL);
            console.log(newUsedUSDT);
            reverseOreders.usedUSDT = newUsedUSDT;
            reverseOreders.open_price = price;
            reverseOreders.pnl = 0;
            reverseOreders.leverage = leverage;
            reverseOreders.open_time = Date.now();
            reverseOreders.amount = (newUsedUSDT * leverage) / price;

            userBalance = await Wallet.findOne({
              coin_id: MarginWalletId,
              user_id: req.body.user_id,
            }).exec();
            userBalance.amount = userBalance.amount - usedUSDT;
            await userBalance.save();

            await reverseOreders.save();
            res.json({ status: "success", data: reverseOreders });
            return;
          } else {
            //Tersine ise
            let checkusdt =
              (reverseOreders.usedUSDT + reverseOreders.pnl) *
              reverseOreders.leverage;
            if (checkusdt == usedUSDT * leverage) {
              reverseOreders.status = 1;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount =
                userBalance.amount +
                reverseOreders.pnl +
                reverseOreders.usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            }

            if (checkusdt > usedUSDT * leverage) {
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              reverseOreders.amount =
                (writeUsedUSDT * reverseOreders.leverage) / price;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            } else {
              /*
                20 lik işlem var
                50 luk ters işlem açıyor
                toplam da 10 luk pozisyon olacak


              */

              let ilkIslem = reverseOreders.usedUSDT;
              let tersIslem = usedUSDT;
              let data = ilkIslem - tersIslem;
              console.log("DATASSS : ", data);
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + data;
              await userBalance.save();

              reverseOreders.type = type;
              reverseOreders.leverage = leverage;
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
              reverseOreders.amount = (writeUsedUSDT * leverage) / price;
              await reverseOreders.save();

              res.json({ status: "success", data: reverseOreders });
              return;
            }
          }
        } else {
          userBalance = await Wallet.findOne({
            coin_id: MarginWalletId,
            user_id: req.body.user_id,
          }).exec();
          userBalance.amount = userBalance.amount - usedUSDT;
          await userBalance.save();
          let order = new MarginOrder({
            pair_id: getPair._id,
            pair_name: getPair.name,
            type: type,
            margin_type: margin_type,
            method: method,
            user_id: user_id,
            usedUSDT: usedUSDT,
            required_margin: usedUSDT,
            isolated: usedUSDT,
            sl: req.body.sl ?? 0,
            tp: req.body.tp ?? 0,
            target_price: 0.0,
            leverage: leverage,
            amount: amount,
            open_price: price,
          });
          await order.save();
          res.json({ status: "success", data: order });
          return;
        }
      }
    } else if (margin_type == "cross") {
      if (method == "limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({ status: "fail", message: "Please enter a greather zero" });
          return;
        }

        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        res.json({ status: "success", data: order });
        return;
      } else if (method == "stop_limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({
            status: "fail",
            message: "Limit price must be greater than 0.",
          });
          return;
        }

        if (stop_limit <= 0) {
          res.json({
            status: "fail",
            message: "Stop limit must be greater than 0.",
          });
          return;
        }

        if (type == "buy") {
          if (stop_limit > target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be greater then target price",
            });
            return;
          }

          if (price > stop_limit) {
            res.json({
              status: "fail",
              message: "Price can't be greater than stop price",
            });
            return;
          }
        }

        if (type == "sell") {
          if (stop_limit < target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be smaller then target price",
            });
            return;
          }
          if (price < stop_limit) {
            res.json({
              status: "fail",
              message: "Price can't be smaller than stop price",
            });
            return;
          }
        }

        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          stop_limit: stop_limit,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        res.json({ status: "success", data: order });
        return;
      } else if (req.body.method == "market") {
        amount =
          ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
        let usedUSDT = (amount * price) / req.body.leverage;

        let reverseOreders = await MarginOrder.findOne({
          user_id: req.body.user_id,
          pair_id: getPair._id,
          margin_type: margin_type,
          method: "market",
          status: 0,
        }).exec();

        if (reverseOreders) {
          console.log("reverse order find");
          if (reverseOreders.leverage > leverage) {
            res.json({ status: "fail", message: "Leverage cannot be smaller" });
            return;
          }
          if (reverseOreders.type == type) {
            let oldAmount = reverseOreders.amount;
            let oldUsedUSDT = reverseOreders.usedUSDT;
            let oldPNL = reverseOreders.pnl;
            let oldLeverage = reverseOreders.leverage;
            let newUsedUSDT = oldUsedUSDT + usedUSDT + oldPNL;
            console.log(oldUsedUSDT, " | ", usedUSDT, " | ", oldPNL);
            console.log(newUsedUSDT);
            reverseOreders.usedUSDT = newUsedUSDT;
            reverseOreders.open_price = price;
            reverseOreders.pnl = 0;
            reverseOreders.leverage = leverage;
            reverseOreders.open_time = Date.now();
            reverseOreders.amount = (newUsedUSDT * leverage) / price;

            userBalance = await Wallet.findOne({
              coin_id: MarginWalletId,
              user_id: req.body.user_id,
            }).exec();
            userBalance.amount = userBalance.amount - usedUSDT;
            await userBalance.save();

            await reverseOreders.save();
            res.json({ status: "success", data: reverseOreders });
            return;
          } else {
            //Tersine ise
            let checkusdt =
              (reverseOreders.usedUSDT + reverseOreders.pnl) *
              reverseOreders.leverage;
            if (checkusdt == usedUSDT * leverage) {
              reverseOreders.status = 1;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount =
                userBalance.amount +
                reverseOreders.pnl +
                reverseOreders.usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            }

            if (checkusdt > usedUSDT * leverage) {
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              reverseOreders.amount =
                (writeUsedUSDT * reverseOreders.leverage) / price;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            } else {
              /*
                20 lik işlem var
                50 luk ters işlem açıyor
                toplam da 10 luk pozisyon olacak


              */

              let ilkIslem = reverseOreders.usedUSDT;
              let tersIslem = usedUSDT;
              let data = ilkIslem - tersIslem;
              console.log("DATASSS : ", data);
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + data;
              await userBalance.save();

              reverseOreders.type = type;
              reverseOreders.leverage = leverage;
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
              reverseOreders.amount = (writeUsedUSDT * leverage) / price;
              await reverseOreders.save();

              res.json({ status: "success", data: reverseOreders });
              return;
            }
          }
        } else {
          userBalance = await Wallet.findOne({
            coin_id: MarginWalletId,
            user_id: req.body.user_id,
          }).exec();
          userBalance.amount = userBalance.amount - usedUSDT;
          await userBalance.save();
          let order = new MarginOrder({
            pair_id: getPair._id,
            pair_name: getPair.name,
            type: type,
            margin_type: margin_type,
            method: method,
            user_id: user_id,
            usedUSDT: usedUSDT,
            required_margin: usedUSDT,
            isolated: usedUSDT,
            sl: req.body.sl ?? 0,
            tp: req.body.tp ?? 0,
            target_price: 0.0,
            leverage: leverage,
            amount: amount,
            open_price: price,
          });
          await order.save();
          res.json({ status: "success", data: order });
          return;
        }
      }
    }
  } catch (err) {
    throw err;
  }
});

route.post("/withdraw", async function (req, res) {
  var user_id = req.body.user_id;
  var address = req.body.address;
  var to = req.body.to;
  var amount = req.body.amount;
  var api_key_result = req.body.api_key;
  /*
  var api_result = await authFile.apiKeyChecker(api_key_result);
  if (api_result === false) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }
  */

  var fromWalelt = await Wallet.findOne({
    address: address,
    user_id: user_id,
  }).exec();
  if (fromWalelt == null) {
    console.log("cuzdan yok");
    res.json({ status: "fail", message: "unknow_error" });
    return;
  }
  let balance = fromWalelt.amount;
  if (amount <= 0) {
    res.json({ status: "fail", message: "invalid_amount" });
    return;
  }
  console.log("Balance : ", balance);
  if (balance <= amount) {
    res.json({ status: "fail", message: "invalid_balance" });
    return;
  }

  let data = new Withdraws({
    user_id: user_id,
    coin_id: fromWalelt.coin_id,
    amount: amount,
    to: to,
    fee: 0.0,
  });

  await data.save();
  fromWalelt.amount = fromWalelt.amount - amount;
  await fromWalelt.save();
  let response = await NotificationTokens.findOne({
    user_id: user_id,
  });

  if (response == null) {
  } else {
    var token = response["token_id"];
    var body =
      "A withdraw order has been given from your account. Please wait for the admin to confirm your order.\n\n";
    notifications.sendPushNotification(token, body);
  }
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

route.post("/spotHistory", async (req, res) => {
  var api_key_result = req.body.api_key;

  let api_result = await authFile.apiKeyChecker(api_key_result);
  if (api_result === false) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }
});
route.post("/deleteLimit", async function (req, res) {
  let order = await Orders.findOne({
    _id: req.body.order_id,
    user_id: req.body.user_id,
    type: "limit",
  }).exec();
  if (order) {
    let amount = order.amount;
    let pair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();

    if (order.method == "buy") {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolTwoID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + order.target_price * amount;
      await toWallet.save();
    } else {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolOneID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + amount;
      await toWallet.save();
    }
  }

  order = await Orders.findOne({
    _id: req.body.order_id,
    user_id: req.body.user_id,
    type: "stop_limit",
  }).exec();

  if (order) {
    let amount = order.amount;
    let pair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();

    if (order.method == "buy") {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolTwoID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + order.target_price * amount;
      await toWallet.save();
    } else {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolOneID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + amount;
      await toWallet.save();
    }
  }

  await Orders.findOneAndUpdate(
    { _id: req.body.order_id, user_id: req.body.user_id, type: "limit" },
    { $set: { status: -1 } }
  ).exec();
  await Orders.findOneAndUpdate(
    { _id: req.body.order_id, user_id: req.body.user_id, type: "stop_limit" },
    { $set: { status: -1 } }
  ).exec();
  res.json({ status: "success", message: "removed" });
});

route.post("/deleteMarginLimit", async function (req, res) {
  let doc = await MarginOrder.findOneAndUpdate(
    {
      _id: req.body.order_id,
      user_id: req.body.user_id,
      method: "limit",
      status: 1,
    },
    { $set: { status: -1 } }
  ).exec();
  if (doc) {
    let userBalance = await Wallet.findOne({
      coin_id: MarginWalletId,
      user_id: doc.user_id,
    }).exec();

    userBalance.amount = userBalance.amount + doc.usedUSDT;
    await userBalance.save();
  }
  doc = await MarginOrder.findOneAndUpdate(
    {
      _id: req.body.order_id,
      user_id: req.body.user_id,
      method: "stop_limit",
      status: 1,
    },
    { $set: { status: -1 } }
  ).exec();
  if (doc) {
    let userBalance = await Wallet.findOne({
      coin_id: MarginWalletId,
      user_id: doc.user_id,
    }).exec();

    userBalance.amount = userBalance.amount + doc.usedUSDT;
    await userBalance.save();
  }

  res.json({ status: "success", message: "removed" });
});

route.all("/addOrders", upload.none(), async function (req, res) {
  try {
    var api_key_result = req.body.api_key;

    let api_result = await authFile.apiKeyChecker(api_key_result);
    if (api_result === false) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }
    let percent = req.body.percent;
    let amount = req.body.amount;

    var getPair = await Pairs.findOne({ name: req.body.pair_name }).exec();
    var fromWalelt = await Wallet.findOne({
      coin_id: getPair.symbolOneID,
      user_id: req.body.user_id,
    }).exec();
    var toWalelt = await Wallet.findOne({
      coin_id: getPair.symbolTwoID,
      user_id: req.body.user_id,
    }).exec();

    console.log(fromWalelt);

    if (amount <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return;
    }

    var urlPair = req.body.pair_name.replace("/", "");
    let url =
      'https://api.binance.com/api/v3/ticker/price?symbols=["' + urlPair + '"]';
    let result = await axios(url);
    var price = result.data[0].price;
    let target_price = req.body.target_price ?? 0.0;
    let stop_limit = req.body.stop_limit ?? 0.0;
    var coins = req.body.pair_name.split("/");

    console.log(req.body.user_id);
    let followerList = await CopyTradeModel.find({
      traderId: req.body.user_id,
      status: "1",
    });

    if (followerList.length > 0) {
      followerList.forEach(async (follower) => {
        let followerWallet = await Wallet.findOne({
          user_id: follower.followerId,
          coin_id: getPair.symbolOneID,
        }).exec();
        if (followerWallet) {
          //burada kullanıcıya trade işlemi yaptırılacak, bakiye düşecek
          //trade tablosuna insert yapıcaz
        }
      });
    }

    console.log("Followers:" + followerList);

    if (req.body.method == "buy") {
      if (req.body.type == "stop_limit") {
        console.log("Stop limit : ", stop_limit);
        let total = amount * stop_limit;
        let balance = toWalelt.amount;

        console.log(balance, " | ", total);
        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }

        if (stop_limit == 0) {
          res.json({
            status: "fail",
            message: "Please enter stop limit",
          });
          return;
        }
        console.log(target_price, " | ", stop_limit);
        if (target_price < stop_limit) {
          res.json({
            status: "fail",
            message:
              "The limit price cannot be more than the stop price Buy limit order must be below the price",
          });
          return;
        }
        if (target_price >= price) {
          res.json({
            status: "fail",
            message: "Buy limit order must be below the price",
          });
          return;
        }
        total = amount * stop_limit;
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: amount,
          open_price: target_price,
          stop_limit: stop_limit,
          type: "stop_limit",
          method: "buy",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        console.log(saved);
        if (saved) {
          toWalelt.amount = toWalelt.amount - total;
          await toWalelt.save();
          res.json({ status: "success", message: saved });
        }
      }
      if (req.body.type == "limit") {
        let total = amount * target_price;
        let balance = toWalelt.amount;
        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }
        target_price = req.body.target_price;
        if (target_price >= price) {
          res.json({
            status: "fail",
            message: "Buy limit order must be below the price",
          });
          return;
        }
        total = amount * target_price;
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: amount,
          open_price: target_price,
          type: "limit",
          method: "buy",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        if (saved) {
          toWalelt.amount = toWalelt.amount - total;
          await toWalelt.save();
          res.json({ status: "success", message: saved });
        }
      } else if (req.body.type == "market") {
        let total = amount * price;
        let balance = toWalelt.amount;

        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }
        if (balance >= total) {
          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: amount,
            open_price: price,
            type: "market",
            method: "buy",
            target_price: req.body.target_price,
          });

          let saved = await orders.save();
          if (saved) {
            fromWalelt.amount =
              parseFloat(fromWalelt.amount) + parseFloat(amount);
            toWalelt.amount = parseFloat(toWalelt.amount) - parseFloat(total);

            await fromWalelt.save();
            await toWalelt.save();
            res.json({ status: "success", message: saved });
          }
        } else {
          res.json({ status: "fail", message: "not_enougth_balance" });
        }
      }
    }

    if (req.body.method == "sell") {
      let balance = fromWalelt.amount;
      amount = (fromWalelt.amount * percent) / 100;
      console.log(balance, " | ", amount);
      if (balance < amount) {
        res.json({ status: "fail", message: "Invalid  balance" });
        return;
      }
      if (req.body.type == "stop_limit") {
        target_price = req.body.target_price;
        let stop_limit = req.body.stop_limit ?? 0.0;
        if (stop_limit == 0) {
          res.json({
            status: "fail",
            message: "Please enter stop limit",
          });
          return;
        }
        if (target_price > stop_limit) {
          res.json({
            status: "fail",
            message:
              "The limit price cannot be less than the stop price Sell limit order must be below the price",
          });
          return;
        }
        if (target_price <= price) {
          res.json({
            status: "fail",
            message: "Sell limit order must be above the price",
          });
          return;
        }
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: amount,
          open_price: target_price,
          stop_limit: stop_limit,
          type: "stop_limit",
          method: "sell",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        if (saved) {
          fromWalelt.amount = fromWalelt.amount - amount;
          await fromWalelt.save();
          res.json({ status: "success", message: saved });
        }
      }
      if (req.body.type == "limit") {
        target_price = req.body.target_price;
        if (target_price <= price) {
          res.json({
            status: "fail",
            message: "Sell limit order must be below the price",
          });
          return;
        }
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: amount,
          open_price: target_price,
          type: "limit",
          method: "sell",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        if (saved) {
          fromWalelt.amount = fromWalelt.amount - amount;
          await fromWalelt.save();
          res.json({ status: "success", message: saved });
        }
      } else if (req.body.type == "market") {
        let balance = fromWalelt.amount;

        if (balance >= amount) {
          let total = amount * price;
          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: amount,
            open_price: price,
            type: "market",
            method: "sell",
            target_price: req.body.target_price,
          });

          let saved = await orders.save();
          if (saved) {
            fromWalelt.amount = fromWalelt.amount - amount;
            toWalelt.amount = toWalelt.amount + total;
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

route.all("/disableAccount", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({ _id: req.body.user_id });

    if (user) {
      user.status = 0;
      await user.save();
      res.json({ status: "success", message: "Account disabled" });
    } else {
      res.json({ status: "fail", message: "Invalid user" });
    }
  } else {
    res.json({ status: "fail", message: "invalid_api_key" });
    return;
  }
});

route.all("/addNewRegisteredAddress", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({ _id: req.body.user_id });

    if (user) {
      let newAddress = new RegisteredAddress({
        user_id: req.body.user_id,
        address: req.body.address,
        coin_id: req.body.coin_id,
        tag: req.body.tag,
      });

      let saved = await newAddress.save();
      if (saved) {
        res.json({ status: "success", message: saved });
      }
    } else {
      res.json({ status: "fail", message: "Invalid user" });
    }
  } else {
    res.json({ status: "fail", message: "invalid_api_key" });
    return;
  }
});

route.all(
  "/getRegisteredAddressList",
  upload.none(),
  async function (req, res) {
    var api_key_result = req.body.api_key;
  }
);

route.all(
  "/enableWithdrawalWhiteList",
  upload.none(),
  async function (req, res) {}
);

route.all("/addNotification", upload.none(), async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const newNotification = new Notification({
      notificationTitle: req.body.notificationTitle,
      notificationMessage: req.body.notificationMessage,
    });
    await newNotification.save();

    let tokens = await NotificationTokens.find({}).exec();
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i].token_id;
      notifications.sendPushNotification(token, req.body.notificationMessage);
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
      createdAt = createdAt.toISOString().replace(/T/, " ").replace(/\..+/, "");
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
    var list = [];
    if (req.body.filter) {
      list = await Orders.find({
        user_id: req.body.user_id,
        type: req.body.filter,
        status: "0",
      })
        .sort({ createdAt: -1 })
        .exec();
    } else {
      list = await Orders.find({
        user_id: req.body.user_id,
        status: "0",
      })
        .sort({ createdAt: -1 })
        .exec();
    }

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
    if (list == null) {
      res.json({ status: "fail", message: "no wallet" });
      return;
    }

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
    var wallets = new Array();
    for (var i = 0; i < _wallets.length; i++) {
      let item = _wallets[i];
      let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
      if (pairInfo == null) continue;
      wallets.push({
        id: item._id,
        coin_id: item.coin_id,

        balance: item.amount,
        address: item.address,
        symbolName: pairInfo.name,
      });
    }
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

route.post("/cancelAllLimit", async function (req, res) {
  var user_id = req.body.user_id;
  let orders = await Orders.findAll({
    _id: req.body.order_id,
    user_id: req.body.user_id,
    type: "limit",
  }).exec();
  for (var i = 0; i < orders.length; i++) {
    let order = orders[i];
    let amount = order.amount;
    let pair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();

    if (order.method == "buy") {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolTwoID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + order.target_price * amount;
      await toWallet.save();
    } else {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolOneID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + amount;
      await toWallet.save();
    }
  }
});

route.post("/cancelAllStopLimit", async function (req, res) {
  var user_id = req.body.user_id;
  let orders = await Orders.findAll({
    _id: req.body.order_id,
    user_id: req.body.user_id,
    type: "stop_limit",
  }).exec();
  for (var i = 0; i < orders.length; i++) {
    let order = orders[i];
    let amount = order.amount;
    let pair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();

    if (order.method == "buy") {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolTwoID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + order.target_price * amount;
      await toWallet.save();
    } else {
      var toWallet = await Wallet.findOne({
        coin_id: pair.symbolOneID,
        user_id: order.user_id,
      }).exec();
      toWallet.amount = toWallet.amount + amount;
      await toWallet.save();
    }
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
          var newBalance = balance + priceAmount;
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
  var emailPin = req.body.emailPin;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var securityKey = await SecurityKey.findOne({
      user_id: user_id,
      status: 1,
    }).exec();

    if (securityKey != null) {
      res.json({ status: "fail", data: "secury_key_active" });
    } else {
      let user = await User.findOne({ _id: user_id }).exec();
      if (user != null) {
        let mailChecker = await MailVerification.findOne({
          email: user.email,
          pin: emailPin,
        }).exec();

        if (mailChecker != null) {
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
        } else {
          res.json({ status: "fail", data: "email_pin_not_match" });
        }
      } else {
        res.json({ status: "fail", message: "user_not_found" });
      }
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

route.all("/getLastLogin", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await LoginLogs.findOne({
      user_id: user_id,
      status: 1,
    }).exec();

    console.log(user);
    let date = user["createdAt"]
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");

    const array = {
      date: date,
      ip: user["ip"],
    };

    if (user != null) {
      var last_login = user["createdAt"];
      res.json({ status: "success", data: array });
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

    let pinVerified = false;
    if (user != null) {
      var twofa = user["twofa"];
      var db_password = user["password"];

      let emailVerifiedCheck = await RegisterMail.findOne({
        user_id: user_id,
        status: 1,
      }).exec();

      let smsVerifiedCheck = await RegisterSMS.findOne({
        user_id: user_id,
        status: 1,
      }).exec();

      if (emailVerifiedCheck != null) {
        let pinCheck = await MailVerification.findOne({
          user_id: user_id,
          pin: req.body.pin,
          reason: "change_password",
        }).exec();

        if (pinCheck != null) {
          pinVerified = true;
        }
      } else {
        if (smsVerifiedCheck != null) {
          let pinCheck = await MailVerification.findOne({
            user_id: user_id,
            pin: req.body.pin,
            reason: "change_password",
          }).exec();

          if (pinCheck != null) {
            pinVerified = true;
          }
        }
      }
      const filter = { _id: user_id, status: 1 };
      if (pinVerified === true) {
        if (utilities.hashData(old_password) == db_password) {
          var result2 = "";
          if (twofa != null) {
            result2 = await authFile.verifyToken(twofapin, twofa);
          } else {
            var check = await RegisterMail.findOne({
              email: user["email"],
              pin: twofapin,
            }).exec();
            if (check != null) {
              result2 = true;
            }
          }

          if (result2 === true) {
            const update = { password: utilities.hashData(password) };
            User.findOneAndUpdate(filter, update, (err, doc) => {
              if (err) {
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
        res.json({ status: "fail", message: "pin_failed" });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/sendMail", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var reason = req.body.reason;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var pin = Math.floor(100000 + Math.random() * 900000);

      mailer.sendMail(
        user["email"],
        "Oxhain verification",
        "Pin : " + pin,
        function (err, data) {
          if (err) {
            console.log("Error " + err);
          } else {
            console.log("Email sent");
          }
        }
      );

      let mailCheck = await MailVerification.findOne({
        email: email,
        reason: reason,
      }).exec();

      if (mailCheck != null) {
        const filter = { email: email, reason: reason };
        const update = { pin: pin };
        MailVerification.findOneAndUpdate(filter, update, (err, doc) => {
          if (err) {
            res.json({ status: "fail", message: err });
          } else {
            res.json({ status: "success", data: "update_success" });
          }
        });
      } else {
        const newPin = new MailVerification({
          email: user["email"],
          pin: pin,
          reason: reason,
          status: 0,
        });

        newPin.save(function (err) {
          if (err) {
            res.json({ status: "fail", message: err });
          } else {
            res.json({ status: "success", data: "mail_sent" });
          }
        });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/sendSMS", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var reason = req.body.reason;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var pin = Math.floor(100000 + Math.random() * 900000);

      mailer.sendSMS(
        user["phone_number"],
        "Oxhain verification",
        "Pin : " + pin,
        function (err, data) {
          if (err) {
            console.log("Error " + err);
          } else {
            console.log("sms sent");
          }
        }
      );

      const newPin = new SMSVerification({
        phone_number: user["phone_number"],
        pin: pin,
        reason: reason,
        status: 0,
      });

      newPin.save(function (err) {
        if (err) {
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "sms_sent" });
        }
      });
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/changeEmail", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var newEmail = req.body.new_email;

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
        const update = { email: newEmail };
        let doc = await User.findOneAndUpdate(filter, update).exec();

        res.json({ status: "success", data: "update_success" });
      } else {
        res.json({ status: "fail", message: "2fa_failed" });
      }
    }
  }
});

route.all("/changePhone", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var country_code = req.body.country_code;
  var phone = req.body.phone;

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
        const update = { phone: phone, country_code: country_code };
        let doc = await User.findOneAndUpdate(filter, update).exec();
        res.json({ status: "success", data: "update_success" });
      } else {
        res.json({ status: "fail", message: "2fa_failed" });
      }
    }
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
            city: user["city"],
            country: user["country"],
            address: user["address"],
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

route.all("/updateUserInfo", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var name = req.body.name;
  var surname = req.body.surname;
  var email = req.body.email;
  var country_code = req.body.country_code;
  var phone_number = req.body.phone_number;
  var city = req.body.city;
  var country = req.body.country;
  var address = req.body.address;

  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    var result2 = "";
    if (user != null) {
      var twofa = user["twofa"];
      if (twofa != null) {
        result2 = await authFile.verifyToken(twofapin, twofa);
      } else {
        var email = user["email"];
        let check = await RegisterMail.findOne({
          email: email,
          pin: twofapin,
        }).exec();

        if (check != null) {
          result2 = true;
        }
      }

      if (result2 === true) {
        const filter = { _id: user_id, status: 1 };
        const update = {
          name: name,
          surname: surname,
          email: email,
          country_code: country_code,
          phone_number: phone_number,
          city: city,
          country: country,
          address: address,
        };
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
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
});

route.all("/testMail", upload.none(), async function (req, res) {
  mailer.sendMail(
    "volkansaka1@hotmail.com",
    "Test Mail",
    "Test Mail Body",
    function (err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        console.log("Email sent successfully");
      }
    }
  );
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

route.all("/getSecurityKey", upload.none(), async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  console.log(user_id);

  let result = await authFile.apiKeyChecker(api_key_result);
  if (result === true) {
    let securityKey = await SecurityKey.find({
      user_id: user_id,
      status: 1,
    }).exec();

    if (securityKey.length > 0) {
      console.log(securityKey);
      res.json({
        status: "success",
        data: {
          response: "success",
          createdAt: securityKey[0]["createdAt"],
          wallet: securityKey[0]["wallet"],
          trade: securityKey[0]["trade"],
          deposit: securityKey[0]["deposit"],
          withdraw: securityKey[0]["withdraw"],
          id: securityKey[0]["id"],
        },
      });
    } else {
      res.json({ status: "fail", message: "security_key_not_active" });
    }
  }
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

route.all("/addCopyTrade", upload.none(), (req, res) => {
  res.json(CopyTrade.test());
});

route.all("/updateCopyTrade", upload.none(), (req, res) => {
  res.json(CopyTrade.updateTrade());
});
route.all("/addWithdraw", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var amount = req.body.amount;
  var currency = req.body.currency;
  var withdraw_address = req.body.to;
  var coin_id = req.body.coin_id;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      Wallet.findOne({ user_id: user_id, coin_id: coin_id }, { amount: 1 })
        .then((list) => {
          if (list == null) {
            console.log("liste yok");
            res.json({ status: "fail", message: "unknow_error" });
            return;
          }
          if (list.amount >= amount) {
            const newWithdraw = new Withdraws({
              user_id: user_id,
              coin_id: coin_id,
              amount: amount,
              to: withdraw_address,
              status: 1,
            });
            NotificationTokens.findOne({
              user_id: user_id,
            }).then((response) => {
              if (response == null) {
              } else {
                var token = response["token_id"];
                newWithdraw.save(function (err, room) {
                  if (err) {
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
