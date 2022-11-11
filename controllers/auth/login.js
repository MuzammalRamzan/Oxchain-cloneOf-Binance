const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const Network = require("../../models/Network");
const CoinList = require("../../models/CoinList");
const Referral = require("../../models/Referral");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const UserRef = require("../../models/UserRef");
const LoginLogs = require("../../models/LoginLogs");
const SecurityKey = require("../../models/SecurityKey");
const axios = require("axios");
const Device = require("../../models/Device");
const NotificationTokens = require("../../models/NotificationTokens");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
const MarginCrossWallet = require("../../models/MarginCrossWallet");
const MarginIsolatedWallet = require("../../models/MarginIsolatedWallet");
const FutureCrossWallet = require("../../models/FutureCrossWallet");
const FutureIsolatedWallet = require("../../models/FutureIsolatedWallet");

const login = async (req, res) => {
  let newRegisteredId;
  var api_key_result = req.body.api_key;
  var deviceName = "null";
  var deviceToken = "null";
  var deviceType = "null";
  var manufacturer = "null";
  var ip = req.body.ip;
  var searchType = req.body.searchType;
  var deviceModel = "null";
  var user_id = req.body.user_id;
  var loginType = req.body.loginType;
  var city = "test";
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

    let securityLevel = 0;

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
      if (emailVerifyCheck && smsVerifyCheck) securityLevel = securityLevel + 1;

      if (req.body.city != undefined) {
        city = req.body.city;
      }

      

      let device = new Device({
        user_id: user._id,
        deviceName: deviceName,
        deviceType: deviceType,
        loginTime : Date.now(),
        ip: ip,
        city: city,
      });
      await device.save();

      let device_id = device._id;

      req.session.device_id = device_id;



      var twofaStatus = user["twofa"];
      if (twofaStatus) securityLevel = securityLevel + 1;

      var results = [];
      var refId = "";
      let userRef = await UserRef.findOne({
        user_id: user._id,
      }).exec();

      const securityKey = await SecurityKey.find({
        user_id: user_id,
        status: 1,
      }).lean();
      if (securityKey) securityLevel = securityLevel + 1;

      if (userRef != null) refId = userRef["refCode"] ?? "";
      else refId = "";
      var data = {
        response: "success",
        email: user.email,
        twofa: twofaStatus,
        emailVerify: emailVerifyExist,
        smsVerify: smsVerifyExist,
        device_id: device_id,
        status: user["status"],
        user_id: user["_id"],
        ref_id: refId,
        securityLevel,
        device_token: device_id
      };

      var status = user["status"];
      if (status == 1) {
        let coins = await CoinList.find({ status: 1 }).exec();

        let networks = await Network.find({ status: 1 }).exec();

        for (let x = 0; x < networks.length; x++) {
          let walletAddressCheck = await WalletAddress.findOne({
            user_id: user._id,
            network_id: networks[x]._id,
          }).exec();





          if (walletAddressCheck == null) {
            let privateKey = "";
            let address = "";

            if (networks[x].symbol === "ERC") {
              console.log("Start ERC");
              let url = "http://34.239.168.239:4455/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }
/*
            if (networks[x].symbol === "AVAX") {
              console.log("Start AVAX");
              let url = "http://44.203.2.70:4458/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }
*/
            if (networks[x].symbol === "BSC") {
              console.log("Start BSC");
              let url = "http://44.203.2.70:4458/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }

            if (networks[x].symbol === "TRC") {
              console.log("Start TRC");
              let url = "http://54.172.40.148:4456/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              console.log(walletTest.data);
              address = walletTest.data.data.address.base58;
              console.log(privateKey);
            }

            if (networks[x].symbol === "BTC") {
              console.log("Start BTCNetwork");
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

            let walletAddress = new WalletAddress({
              user_id: user._id,
              network_id: networks[x]._id,
              address: address,
              private_key: privateKey,
              wallet_address: address,
            });

            await walletAddress.save();
          }
        }
        for (let i = 0; i < coins.length; i++) {
          let walletResult = await WalletAddress.findOne({
            user_id: user._id,
            coin_id: coins[i]._id,
          }).exec();

          if (walletResult === null) {
          } else {
            console.log("Cüzdan var");
          }

          //Margin Wallet Check
          let margin_cross_check = await MarginCrossWallet.findOne({user_id: user._id, coin_id : coins[i]._id});
          if(margin_cross_check == null) {
            let createWallet = new MarginCrossWallet({
              user_id: user._id,
              coin_id : coins[i]._id,
              amount : 0.0,
              type : "margin_cross",
              pnl : 0.0,
              totalBonus : 0.0,
              status : 1
            });
            await createWallet.save();
          }

          let margin_isole_check = await MarginIsolatedWallet.findOne({user_id: user._id, coin_id : coins[i]._id});
          if(margin_isole_check == null) {
            let createWallet = new MarginIsolatedWallet({
              user_id: user._id,
              coin_id : coins[i]._id,
              amount : 0.0,
              type : "margin_isolated",
              pnl : 0.0,
              totalBonus : 0.0,
              status : 1
            });
            await createWallet.save();
          }

          //Future Wallet Check
          let future_cross_check = await FutureCrossWallet.findOne({user_id: user._id, coin_id : coins[i]._id});
          if(future_cross_check == null) {
            let createWallet = new FutureCrossWallet({
              user_id: user._id,
              coin_id : coins[i]._id,
              amount : 0.0,
              type : "future_cross",
              pnl : 0.0,
              totalBonus : 0.0,
              status : 1
            });
            await createWallet.save();
          }

          let future_isole_check = await FutureIsolatedWallet.findOne({user_id: user._id, coin_id : coins[i]._id});
          if(future_isole_check == null) {
            let createWallet = new FutureIsolatedWallet({
              user_id: user._id,
              coin_id : coins[i]._id,
              amount : 0.0,
              type : "future_isolated",
              pnl : 0.0,
              totalBonus : 0.0,
              status : 1
            });
            await createWallet.save();
          }
          //End check
          const newWallet = new Wallet({
            name: coins[i]["name"],
            symbol: coins[i]["symbol"],
            user_id: user["id"],
            amount: 0,
            coin_id: coins[i]["id"],
            type: "spot",
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
