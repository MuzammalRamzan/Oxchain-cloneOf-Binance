"use strict";
const Connection = require("./Connection");
const bodyParser = require("body-parser");
const multer = require("multer");
const express = require("express");
const cors = require("cors");
const { expressjwt: jwt } = require("express-jwt");

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
const Profit = require("./adminController/Profit");
const Admin = require("./adminController/Admin");
const User = require("./adminController/User");
const Bonus = require("./adminController/Bonus");
const Deposit = require("./adminController/Deposit");
const Pairs = require("./adminController/Pairs");
const Wallet = require("./adminController/Wallet");
const Withdraw = require("./adminController/Withdraw");
const Earnings = require("./adminController/Earnings");
const AdminDashboard = require("./adminController/AdminDashboard");
const GetKyc = require("./adminController/GetKyc");
const ApproveKyc = require("./adminController/ApproveKyc");
const ApproveRecidency = require("./adminController/ApproveRecidency");
const DenyKyc = require("./adminController/DenyKyc");


const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));


route.use(function (err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401).send("error: invalid token");
  } else {
    next(err);
  }
});

route.get("/", (req, res) => {
  res.send("success");
});

route.all("/login", upload.none(), Login);
route.all("/addAdmin", upload.none(), Admin.addAdmin);
route.all("/editAdmin", upload.none(), Admin.editAdmin);
route.all("/ApproveKyc", upload.none(), ApproveKyc);
route.all("/ApproveRecidency", upload.none(), ApproveRecidency);
route.all("/DenyKyc", upload.none(), DenyKyc);
route.all("/GetKyc", upload.none(), GetKyc);

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
route.all("/depositList", upload.none(), Deposit.listDeposits);
route.all("/listPairs", upload.none(), Pairs.listPairs);
route.all("/setPairFee", upload.none(), Pairs.setPairFee);
route.all("/getUserBalance", upload.none(), Wallet.getUserBalance);
route.all("/getWalletBalance", upload.none(), Wallet.getWalletBalance);
route.all("/setBalance", upload.none(), Wallet.setBalance);
route.all("/userWithdraws", upload.none(), Withdraw.userWithdraws);
route.all("/listWithdraws", upload.none(), Withdraw.listWithdraws);
route.all("/getProfit", upload.none(), Profit.ProfitAll);
route.all("/getEarnings", upload.none(), Earnings.getEarnings);
route.all("/addEarning", upload.none(), Earnings.AddEarning);
route.all("/getAdminDashboard", upload.none(), AdminDashboard.getData);

route.listen(port, () => {
  console.log("Server Ayakta");
});
