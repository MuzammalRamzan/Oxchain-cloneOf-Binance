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
const AddAdmin = require("./adminController/AddAdmin");
const userList = require("./adminController/userList");
const editAdmin = require("./adminController/editAdmin");
const listAdmin = require("./adminController/listAdmin");
const {editUser} = require("./adminController/editUser");
const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});

route.all("/login", upload.none(), Login);
route.all("/addAdmin", upload.none(), AddAdmin);
route.all("/editAdmin", upload.none(), editAdmin);
route.all("/listAdmin", upload.none(), listAdmin);
route.all("/editUser", upload.none(), editUser);

route.listen(port, () => {
  console.log("Server Ayakta");
});
