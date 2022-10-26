"use strict";
var authFile = require("./auth.js");
var mailer = require("./mailer.js");
var CopyTrade = require("./CopyTrade.js");
const Connection = require("./Connection");
var bodyParser = require("body-parser");
const multer = require("multer");
const express = require("express");
var cors = require("cors");

require("dotenv").config();

// controllers
const login = require("./controllers/auth/login");
const transfer = require("./controllers/wallet/transfer");
const sendMailPin = require("./controllers/sendMailPin");
const sendSMSPin = require("./controllers/sendSMSPin");
const register = require("./controllers/auth/register");
const addCoin = require("./controllers/coin/addCoin");
const copyLeaderRequest = require("./controllers/copyLeaderRequest");
const getClosedMarginOrders = require("./controllers/orders/getClosedMarginOrders");
const getOpenMarginOrders = require("./controllers/orders/getOpenMarginOrders");
const closeMarginOrder = require("./controllers/orders/closeMarginOrder");
const addMarginOrder = require("./controllers/orders/addMarginOrder");
const withdraw = require("./controllers/withdraw/withdraw");
const deleteLimit = require("./controllers/wallet/deleteLimit");
const deleteMarginLimit = require("./controllers/wallet/deleteMarginLimit");
const addOrders = require("./controllers/orders/addOrders");
const disableAccount = require("./controllers/users/disableAccount");
const addNewRegisteredAddress = require("./controllers/addNewRegisteredAddress");
const addNotification = require("./controllers/addNotification");
const getNotification = require("./controllers/getNotification");
const getOrders = require("./controllers/orders/getOrders");
const getUSDTBalance = require("./controllers/wallet/getUSDTBalance");
const getPairs = require("./controllers/pair/getPairs");
const addPair = require("./controllers/pair/addPair");
const getDigits = require("./controllers/pair/getDigits");
const getCoinList = require("./controllers/coin/getCoinList");
const getCoinInfo = require("./controllers/coin/getCoinInfo");
const getWallet = require("./controllers/wallet/getWallet");
const twoFactor = require("./controllers/auth/twoFactor");
const update2fa = require("./controllers/auth/update2fa");
const cancelAllLimit = require("./controllers/wallet/cancelAllLimit");
const cancelAllStopLimit = require("./controllers/wallet/cancelAllStopLimit");
const cancelOrder = require("./controllers/orders/cancelOrder");
const addSecurityKey = require("./controllers/securityKey/addSecurityKey");
const updateSecurityKey = require("./controllers/securityKey/updateSecurityKey");
const lastActivities = require("./controllers/lastActivities");
const updatePhone = require("./controllers/users/updatePhone");
const resetPassword = require("./controllers/users/resetPassword");
const changeEmail = require("./controllers/users/changeEmail");
const changePassword = require("./controllers/users/changePassword");
const getUserId = require("./controllers/users/getUserId");
const getUserInfo = require("./controllers/users/getUserInfo");
const updateUserInfo = require("./controllers/users/updateUserInfo");
const getLastLogin = require("./controllers/getLastLogin");
const checkSecurityKey = require("./controllers/securityKey/checkSecurityKey");
const getSecurityKey = require("./controllers/securityKey/getSecurityKey");
const deleteSecurityKey = require("./controllers/securityKey/deleteSecurityKey");
const addWithdraw = require("./controllers/withdraw/addWithdraw");
const get2fa = require("./controllers/auth/get2fa");
const sendSMS = require("./controllers/sendMail");
const sendMail = require("./controllers/sendMail");
const changePhone = require("./controllers/users/changePhone");
const getDepositsUSDT = require("./controllers/coin/getDepositsUSDT");
const depositCoinList = require("./controllers/deposit/getCoinList");
const depositCoinNetworkOptions = require("./controllers/deposit/getCoinNetworkOption");
const addCoinNetworkOption = require("./controllers/deposit/addCoinNetworkOption");
const addNetwork = require("./controllers/deposit/addNetwork");
const depositNetworkList = require("./controllers/deposit/getNetworkList");
const depositWalletAddress = require("./controllers/deposit/getWalletAddress");
//var formattedKey = authenticator.generateKey();
//var formattedToken = authenticator.generateToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse");
//console.log(authenticator.verifyToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse", "260180"));
//console.log(formattedToken);

Connection.connection();
var route = express();
const delay = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};
route.use(cors());
var port = process.env.PORT;

const Subscription = require("./models/Subscription");
const topReferrals = require("./controllers/referrals/topReferrals.js");
const getReferral = require("./controllers/referrals/getReferral.js");
const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});

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

//DEPOSIT

//AUTH
route.all("/login", upload.none(), login);
route.all("/sendMailPin", sendMailPin);
route.all("/sendSMSPin", sendSMSPin);
route.all("/register", upload.none(), register);
route.all("/disableAccount", upload.none(), disableAccount);
route.all("/2fa", upload.none(), twoFactor);
route.all("/update2fa", upload.none(), update2fa);

//Wallet Modules
route.post("/transfer", transfer);
route.post("/withdraw", withdraw);

route.post("/depositCoinList", depositCoinList);
route.post("/depositCoinNetworkOptions", depositCoinNetworkOptions);
route.post("/depositWalletAddress", depositWalletAddress);


route.all("/addCoinNetworkOption", addCoinNetworkOption);
route.all("/addNetwork", addNetwork);
route.all("/depositNetworkList", depositNetworkList);
route.all("/addCoin", upload.none(), addCoin);


route.all("/CopyLeaderRequest", upload.none(), copyLeaderRequest);
route.all("/getUSDTBalance", upload.none(), getUSDTBalance);


//Trade Modules
route.all("/getOrders", upload.none(), getOrders);
route.post("/getClosedMarginOrders", getClosedMarginOrders);
route.post("/getOpenMarginOrders", getOpenMarginOrders);
route.post("/closeMarginOrder", closeMarginOrder);
route.post("/addMarginOrder", addMarginOrder);
route.post("/spotHistory", async (req, res) => {
  var api_key_result = req.body.api_key;

  let api_result = await authFile.apiKeyChecker(api_key_result);
  if (api_result === false) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }
});
route.post("/deleteLimit", deleteLimit);
route.post("/deleteMarginLimit", deleteMarginLimit);
route.all("/addOrders", upload.none(), addOrders);

route.all("/addNewRegisteredAddress", upload.none(), addNewRegisteredAddress);
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
route.all("/addNotification", upload.none(), addNotification);
route.all("/getNotification", upload.none(), getNotification);

route.all("/getPairs", upload.none(), getPairs);
route.all("/addPair", upload.none(), addPair);
route.all("/getDigits", upload.none(), getDigits);
route.all("/getCoinList", upload.none(), getCoinList);
route.all("/getCoinInfo", upload.none(), getCoinInfo);

//Referral Modules
route.all("/getReferral", upload.none(), getReferral);
route.all("/topReferrals", upload.none(), topReferrals);

route.all("/getWallet", upload.none(), getWallet);

route.post("/cancelAllLimit", cancelAllLimit);
route.post("/cancelAllStopLimit", cancelAllStopLimit);
route.all("/cancelOrder", upload.none(), cancelOrder);
route.all("/addSecurityKey", upload.none(), addSecurityKey);
route.all("/updateSecurityKey", upload.none(), updateSecurityKey);
route.all("/lastActivities", upload.none(), lastActivities);
route.all("/updatePhone", upload.none(), updatePhone);
route.all("/resetPassword", upload.none(), resetPassword);
route.all("/getLastLogin", upload.none(), getLastLogin);
route.all("/changePassword", upload.none(), changePassword);
route.all("/sendMail", upload.none(), sendMail);
route.all("/sendSMS", upload.none(), sendSMS);
route.all("/changeEmail", upload.none(), changeEmail);
route.all("/changePhone", upload.none(), changePhone);
route.all("/get2fa", upload.none(), get2fa);
route.all("/getUserInfo", upload.none(), getUserInfo);
route.all("/updateUserInfo", upload.none(), updateUserInfo);
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

route.all("/getUserId", upload.none(), getUserId);
route.all("/getSecurityKey", upload.none(), getSecurityKey);
route.all("/checkSecurityKey", upload.none(), checkSecurityKey);
route.all("/deleteSecurityKey", upload.none(), deleteSecurityKey);
route.all("/addCopyTrade", upload.none(), (req, res) => {
  res.json(CopyTrade.test());
});

route.all("/updateCopyTrade", upload.none(), (req, res) => {
  res.json(CopyTrade.updateTrade());
});
route.all("/addWithdraw", upload.none(), addWithdraw);
route.all("/getDepositsUSDT", upload.none(), getDepositsUSDT);

route.listen(port, () => {
  console.log("Server Ayakta");
});
