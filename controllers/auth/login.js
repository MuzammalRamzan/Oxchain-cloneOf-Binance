
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
const ApiRequest = require("../../models/ApiRequests");
const ApiKeysModel = require("../../models/ApiKeys");
const AITradeWalletModel = require("../../models/AITradeWallet");
const mailer = require("../../mailer");

const SMSVerificationModel = require("../../models/SMSVerification");
const MailVerificationModel = require("../../models/MailVerification");

let mailVerificationSent = false;
let smsVerificationSent = false;

let pinSent = false;

const moment = require("moment");
//istanbul date format

const { getToken } = require("../../auth");

const MarginWalletId = "62ff3c742bebf06a81be98fd";

const login = async (req, res) => {
  let newRegisteredId;
  var api_key_result = req.body.api_key;
  var deviceName = "null";
  var deviceToken = "null";
  var deviceOS = "null";
  var deviceVersion = "null";
  var deviceType = "null";
  var manufacturer = "null";

  //getting ip as ::1 for localhost, so we need to get the real ip address
  var ip = req.socket.remoteAddress;
  if (ip.substr(0, 7) == "::ffff:") {
    ip = ip.substr(7);
  }
  console.log(ip);


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
  if (req.body.deviceVersion != undefined) {
    deviceVersion = req.body.deviceVersion;
  }
  if (req.body.deviceOS != undefined) {
    deviceOS = req.body.deviceOS;
  }

  if (req.body.deviceType != undefined) {
    deviceModel = req.body.deviceType;
  }

  if (req.body.manufacturer != undefined) {
    manufacturer = req.body.manufacturer;
  }


  let getIP = await axios.get("http://ip-api.com/json/" + ip);
  if (getIP.data.status == "success") {
    city = getIP.data.country + " " + getIP.data.city;
  }



  var notificationToken = req.body.notificationToken;
  let result = await authFile.apiKeyChecker(api_key_result);
  let UserApiKey = false;
  let checkApiKeys = "";
  if (result === false) {

    checkApiKeys = await ApiKeysModel.findOne({
      api_key: api_key_result,
    }).exec();

    if (checkApiKeys != null) {
      UserApiKey = true;
    }
  }

  if (result === true || UserApiKey === true) {


    if (UserApiKey === true) {

      let newApiKeyRequest = new ApiRequest({
        user_id: checkApiKeys.user_id,
        request: "login",
        ip: ip,
        api_key: api_key_result,
      });
      newApiKeyRequest.save();
    }

    let user = "";

    if (searchType == "email") {

      user = await User.findOne({
        email: req.body.user,
      }).exec();
      if (user) {
        user = await User.findOne({
          email: req.body.user,
          password: utilities.hashData(req.body.password),
        }).exec();
        if (!user) {
          return res.json({
            status: "fail",
            message: "Incorrect Password",
            showableMessage: "Incorrect Password",
          });
        }
      }


    }
    else {
      user = await User.findOne({
        phone_number: req.body.user,
      }).exec();
      if (user) {
        user = await User.findOne({
          phone_number: req.body.user,
          password: utilities.hashData(req.body.password),
        }).exec();

        if (!user) {
          return res.json({
            status: "fail",
            message: "Incorrect Password",
            showableMessage: "Incorrect Password",
          });
        }
      }

    }

    let securityLevel = 0;
    if (user?.deleted) {
      return res.json({
        status: "fail",
        message: "user deleted",
        showableMessage: "User deleted",
      });
    }
    if (user != null) {


      let AITradeWalletCheck = await AITradeWalletModel.findOne({
        user_id: user._id,
      }).exec();

      if (AITradeWalletCheck == null) {
        let newAITradeWallet = new AITradeWalletModel({
          user_id: user._id,
          balance: 0,
          enabled: 0,
          status: 0,
        });

        newAITradeWallet.save();
      }


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
        deviceOs: deviceOS,
        deviceVersion: deviceVersion,
        loginTime: Date.now(),
        loginRequest: "",
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

      //date now of istanbul

      let dateNow = moment().format("YYYY-MM-DD HH:mm:ss");

      //change created at to istanbul time

      let createdAt = "";
      if (logs.length > 0) {

        createdAt = moment(logs[0]["createdAt"]).add(3, "hours");
        logs[0]["createdAt"] = createdAt;

      }



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

      let loginLogCheck = await LoginLogs.findOne({
        user_id: user._id,
        ip: ip,
        status: "completed"
      }).exec();

      if (loginLogCheck == null) {
        //burada pin göndereceğiz 

        pinSent = true;
        //generate random pin
        var verificationPin = Math.floor(100000 + Math.random() * 900000);


        if (user.email != undefined && user.email != "" && user.email != null) {

          let mailCheck = await MailVerificationModel.findOne({
            user_id: user._id,
            reason: "login_verification",
          }).exec();

          if (mailCheck != null) {
            mailCheck.pin = verificationPin;
            mailCheck.status = "0";
            await mailCheck.save();
          }
          else {
            let newMailVerification = new MailVerificationModel({
              user_id: user._id,
              pin: verificationPin,
              reason: "login_verification",
              status: "0",
            });

            await newMailVerification.save();
          }

          mailVerificationSent = true;

          mailer.sendMail(user.email, "New Login", "An unusual login has been detected from your account. </br><p style='font-weight:bold'>Pin:" + verificationPin + "</p> If you did not authorize this login, please contact support immediately.");

        }
        else {
          verificationPin = "000000";
          if (user.phone_number != undefined && user.phone_number != "" && user.phone_number != null) {
            smsVerificationSent = true;

            let smsCheck = await SMSVerificationModel.findOne({
              user_id: user._id,
              reason: "login_verification",
            }).exec();

            if (smsCheck != null) {
              smsCheck.pin = verificationPin;
              smsCheck.status = "0";
              await smsCheck.save();
            }
            else {
              let newSMSVerification = new SMSVerificationModel({
                user_id: user._id,
                pin: verificationPin,
                reason: "login_verification",
                status: "0",
              });
              await newSMSVerification.save();
            }
            let smsText = "An unusual login has been detected from your account. Verification Pin:" + verificationPin + " If you did not authorize this login, please contact support immediately.";
            mailer.sendSMS(user.country_code, user.phone_number, smsText);
          }
        }
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
        showableUserId: user.showableUserId,
        last_login: logs,
        verificationStatus: verificationStatus,
        mailVerificationSent: mailVerificationSent,
        smsVerificationSent: smsVerificationSent,
      };


      var status = user["status"];

      if (status == "1") {
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
              let url = "http://" + process.env.ERC20HOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }

            if (networks[x].symbol === "BSC") {
              let url = "http://" + process.env.BSC20HOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }

            if (networks[x].symbol === "TRC") {
              let url = "http://" + process.env.TRC20HOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address.base58;
            }

            if (networks[x].symbol === "SEGWIT") {
              let createBTC = await axios.request({
                method: "post",
                url: "http://" + process.env.BTCSEQHOST,
                data: "request=create_address",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              });

              address = createBTC.data.message;
            }

            if (networks[x].symbol === "SOL") {
              let url = "http://" + process.env.SOLANAHOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = JSON.stringify(walletTest.data.data.pKey);
              address = walletTest.data.data.address;
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

        //get ip of user
        const newUserLog = new LoginLogs({
          user_id: user["_id"],
          ip: ip,
          deviceName: deviceName,
          manufacturer: manufacturer,
          model: deviceModel,
          deviceOS: req.body.deviceOS ?? "Unknown",
          status: pinSent ? "pin_sent" : "success",
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



        let notificationCheck = await SiteNotificationsModel.findOne({
          user_id: user["_id"],
        }).exec();

        console.log("notificationCheck", notificationCheck);

        if (notificationCheck != null) {

          if (notificationCheck.system_messages == 1 || notificationCheck.system_messages == "1") {
            mailer.sendMail(user.email, "Login", "Successfully logged in from " + ip);
          }
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

                return res.json({ status: "success", data: data });
              }
            });
          } else {

            return res.json({ status: "success", data: data });
          }
        } else {
          return res.json({ status: "success", data: data });
        }
      }
      if (status == "0") {
        return res.json({
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
    else {
      return res.json({
        status: "fail",
        message: "user_not_found",
        showableMessage: "User not Found",
      });
    }
  } else {
    return res.json({
      status: "fail",
      message: "Forbidden 403",
      showableMessage: "Forbidden 403",
    });
  }
};

module.exports = login;

