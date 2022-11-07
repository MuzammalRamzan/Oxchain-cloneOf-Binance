const Admin = require("../models/Admin");

var authFile = require("../auth.js");
var UserModel = require("../models/User");
var utilities = require("../utilities.js");
const { MongoBulkWriteError } = require("mongodb");

const BanUser = async (req, res) => {
  //burada banlanacak kullanıcı id'si alınacak

  var apiKey = req.body.apiKey;
  var userId = req.body.userId;

  if (apiKey == null || userId == null) {
    return res.json({
      status: "error",
      message: "Api key or user id is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var user = await UserModel.findOne({ _id: userId });

  if (user == null) {
    return res.json({
      status: "error",
      message: "User not found",
    });
  }

  user.status = "5";

  await user.save();

  res.json({
    status: "success",
    message: "User banned",
  });
};

const ReBanUser = async (req, res) => {
  var apiKey = req.body.apiKey;
  var userId = req.body.userId;

  if (apiKey == null || userId == null) {
    return res.json({
      status: "error",
      message: "Api key or user id is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var user = await UserModel.findOne({ _id: userId, status: "5" });

  if (user == null) {
    return res.json({
      status: "error",
      message: "User not found",
    });
  }

  user.status = "1";

  await user.save();

  res.json({
    status: "success",
    message: "User re-banned",
  });
};

module.exports = {
  BanUser,
  ReBanUser,
};
