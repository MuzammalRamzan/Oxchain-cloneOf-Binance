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
var port = 3003;

const Login = require("./adminController/Login");
const Admin = require("./adminController/Admin");
const User = require("./adminController/User");
const Bonus = require("./adminController/Bonus");
const Deposit = require("./adminController/Deposit");
const Pairs = require("./adminController/Pairs");
const Wallet = require("./adminController/Wallet");
const Withdraw = require("./adminController/Withdraw");

const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});

route.all("/login", upload.none(), Login);
route.all("/addAdmin", upload.none(), Admin.addAdmin);
route.all("/editAdmin", upload.none(), Admin.editAdmin);
route.all("/listAdmin", upload.none(), Admin.listAdmin);
route.all("/getAdmin", upload.none(), Admin.getAdmin);
route.all("/editUser", upload.none(), User.editUser);
route.all("/BanUser", upload.none(), User.BanUser);
route.all("/ReBanUser", upload.none(), User.ReBanUser);
route.all("/getUser", upload.none(), User.getUser);
route.all("/userList", upload.none(), User.userList);
route.all("/denyApplicant", upload.none(), User.denyApplicant);
route.all("/setBonusRate", upload.none(), Bonus.setBonusRate);
route.all("/userDeposits", upload.none(), Deposit.userDeposits);
route.all("/listPairs", upload.none(), Pairs.listPairs);
route.all("/setPairFee", upload.none(), Pairs.setPairFee);
route.all("/getUserBalance", upload.none(), Wallet.getUserBalance);
route.all("/getWalletBalance", upload.none(), Wallet.getWalletBalance);
route.all("/setBalance", upload.none(), Wallet.setBalance);
route.all("/userWithdraws", upload.none(), Withdraw.userWithdraws);

route.listen(port, () => {
  console.log("Server Ayakta");
});
