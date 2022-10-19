const User = require("../../models/Test");
const Wallet = require("../../models/Wallet");
const CoinList = require("../../models/CoinList");
const Referral = require("../../models/Referral");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const UserRef = require("../../models/UserRef");
const LoginLogs = require("../../models/LoginLogs");
const axios = require("axios");
const NotificationTokens = require("../../models/NotificationTokens");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");

const login = async (req, res) => {
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
  }

  var notificationToken = req.body.notificationToken;
  let result = await authFile.apiKeyChecker(api_key_result);

  console.log(searchType);
  if (result === true) {
    let user = await User.findOne({
      [searchType]: req.body.user,
      password: utilities.hashData(req.body.password),
    }).exec();

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
};

module.exports = login;
