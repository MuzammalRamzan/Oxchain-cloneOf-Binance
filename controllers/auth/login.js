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
const { getApplicantStatus } = require("../../sumsub");
const FutureWalletModel = require("../../models/FutureWalletModel");
const WithdrawalWhiteListModel = require("../../models/WithdrawalWhiteList");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");
const SiteNotificationsModel = require("../../models/SiteNotifications");
const VerificationIdModel = require("../../models/VerificationId");

const { getToken } = require("../../auth");

const MarginWalletId = "62ff3c742bebf06a81be98fd";

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
  var pin = req.body.pin;
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

  if (result === true) {
    let user = await User.findOne({
      [searchType]: req.body.user,
      password: utilities.hashData(req.body.password),
    }).exec();
    let securityLevel = 0;

    if (user != null) {
      let emailVerifyCheck = await RegisterMail.findOne({
        email: user.email,
        pin: pin,
        status: "1",
      });

      let smsVerifyCheck = await RegisterSMS.findOne({
        phone_number: user.phone_number,
        pin: pin,
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

      let checkSiteNotifications = await SiteNotificationsModel.findOne({
        user_id: user._id,
      }).exec();

      if (checkSiteNotifications == null) {
        let siteNotifications = new SiteNotificationsModel({
          user_id: user._id,
          activities: 1,
          trade: 1,
          news: 1,
          system_messages: 1,
        });
        await siteNotifications.save();
      }

      let device = new Device({
        user_id: user._id,
        deviceName: deviceName,
        deviceType: deviceType,
        loginTime: Date.now(),
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

      if (userRef != null) refId = userRef["refCode"] ?? "";
      else refId = "";

      let VerificationCheck = await VerificationIdModel.findOne({
        user_id: user._id,
      }).exec();

      let verificationStatus;
      if (VerificationCheck != null) {
        if (VerificationCheck.status == 1) {
          verificationStatus = "verified";
        }

        if (VerificationCheck.status == 0) {
          verificationStatus = "pending";
        }

        if (VerificationCheck.status == 2) {
          verificationStatus = "rejected";
        }
      } else {
        verificationStatus = "none";
      }

      var data = {
        response: "success",
        email: user.email,
        country_code: user.country_code ?? "",
        phone_number: user.phone_number ?? "",
        twofa: twofaStatus,
        emailVerify: emailVerifyExist,
        smsVerify: smsVerifyExist,
        device_id: device_id,
        status: user["status"],
        user_id: user["_id"],
        ref_id: refId,
        securityLevel,
        device_token: device_id,
        avatar: user.avatar ?? "",
        token: getToken({ user: user_id }),
        name: user.name,
        nickname: user.nickname,
        last_login: logs,
        verificationStatus: verificationStatus,
      };

      if (smsVerifyExist == "no" && emailVerifyExist == "no") {
        res.json({
          status: "fail",
          message: "Invalid Credentials",
        });
      } else {
        var status = user["status"];

        if (status == "1") {
          let coins = await CoinList.find({ status: 1 }).exec();

          let networks = await Network.find({ status: 1 }).exec();

          // for (let x = 0; x < networks.length; x++) {
          //   let walletAddressCheck = await WalletAddress.findOne({
          //     user_id: user._id,
          //     network_id: networks[x]._id,
          //   }).exec();

          //   if (walletAddressCheck == null) {
          //     let privateKey = "";
          //     let address = "";
          //     console.log(networks[x].symbol);
          //     if (networks[x].symbol === "ERC") {
          //       console.log("Start ERC");
          //       let url = "http://54.167.28.93:4455/create_address";
          //       let walletTest = await axios.post(url);
          //       privateKey = walletTest.data.data.privateKey;
          //       address = walletTest.data.data.address;
          //     }

          //     if (networks[x].symbol === "BSC") {
          //       console.log("Start BSC");
          //       let url = "http://44.203.2.70:4458/create_address";
          //       let walletTest = await axios.post(url);
          //       privateKey = walletTest.data.data.privateKey;
          //       address = walletTest.data.data.address;
          //     }

          //     if (networks[x].symbol === "TRC") {
          //       console.log("Start TRC");
          //       let url = "http://54.172.40.148:4456/create_address";
          //       let walletTest = await axios.post(url);
          //       privateKey = walletTest.data.data.privateKey;
          //       address = walletTest.data.data.address.base58;
          //     }

          //     if (networks[x].symbol === "SEGWIT") {
          //       console.log("Start BTCNetwork");
          //       let createBTC = await axios.request({
          //         method: "post",
          //         url: "http://3.15.2.155",
          //         data: "request=create_address",
          //         headers: {
          //           "Content-Type": "application/x-www-form-urlencoded",
          //         },
          //       });

          //       address = createBTC.data.message;
          //     }

          //     if (networks[x].symbol === "SOL") {
          //       console.log("Start SOL");
          //       let url = "http://3.144.178.156:4470/create_address";
          //       let walletTest = await axios.post(url);
          //       privateKey = JSON.stringify(walletTest.data.data.pKey);
          //       address = walletTest.data.data.address;
          //     }

          //     let walletAddress = new WalletAddress({
          //       user_id: user._id,
          //       network_id: networks[x]._id,
          //       address: address,
          //       private_key: privateKey,
          //       wallet_address: address,
          //     });

          //     await walletAddress.save();
          //   }
          // }
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
            let margin_cross_check = await MarginCrossWallet.findOne({
              user_id: user._id,
              coin_id: coins[i]._id,
            });
            if (margin_cross_check == null) {
              let createWallet = new MarginCrossWallet({
                user_id: user._id,
                coin_id: coins[i]._id,
                symbol: coins[i].symbol,
                amount: 0.0,
                type: "margin_cross",
                pnl: 0.0,
                totalBonus: 0.0,
                status: 1,
              });
              await createWallet.save();
            }

            let margin_isole_check = await MarginIsolatedWallet.findOne({
              user_id: user._id,
              coin_id: coins[i]._id,
            });
            if (margin_isole_check == null) {
              let createWallet = new MarginIsolatedWallet({
                user_id: user._id,
                coin_id: coins[i]._id,
                symbol: coins[i].symbol,
                amount: 0.0,
                type: "margin_isolated",
                pnl: 0.0,
                totalBonus: 0.0,
                status: 1,
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

          // Future Wallet Check

          let future_wallet_check = await FutureWalletModel.findOne({
            user_id: user._id,
          });
          if (future_wallet_check == null) {
            let createWallet = new FutureWalletModel({
              user_id: user._id,
              coin_id: MarginWalletId,
              symbol: "USDT",
              amount: 0.0,
              type: "future",
              pnl: 0.0,
              totalBonus: 0.0,
              status: 1,
            });
            await createWallet.save();
          }

          const newUserLog = new LoginLogs({
            user_id: user["_id"],
            ip: ip,
            deviceName: deviceName,
            manufacturer: manufacturer,
            model: deviceModel,
            status: "completed",
          });
          console.log("newUserLognewUserLog", newUserLog);
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

          const withdrawalWhiteList = await WithdrawalWhiteListModel.findOne({
            user_id: user._id,
          }).lean();
          data.withdrawalWhiteList = !!withdrawalWhiteList?.status;
          const oneStepWithdraw = await OneStepWithdrawModel.findOne({
            user_id: user._id,
          }).lean();
          data.oneStepWithdraw = !!oneStepWithdraw?.status;

          if (user.applicantId) {
            const applicantData = await getApplicantStatus(user.applicantId);
            const applicantStatus =
              applicantData?.reviewResult?.reviewAnswer == "GREEN" ? 1 : 0;
            await User.updateOne(
              { _id: user_id },
              { $set: { applicantStatus } }
            );
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
          res.json({
            status: "fail",
            message: "account_not_active",
            showableMessage: "Account not active",
          });
        }

        if (status == "5") {
          res.json({
            status: "fail",
            message: "account_disabled",
            showableMessage: "Account is disabled",
          });
        }
      }
    } else {
      res.json({
        status: "fail",
        message: "user_not_found",
        showableMessage: "User not Found",
      });
    }
  } else {
    res.json({
      status: "fail",
      message: "Forbidden 403",
      showableMessage: "Forbidden 403",
    });
  }
};

module.exports = login;
