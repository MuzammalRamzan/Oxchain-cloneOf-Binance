const Admin = require("../models/Admin");

var authFile = require("../auth.js");
var UserModel = require("../models/User");
var utilities = require("../utilities.js");

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

const editUser = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const twoFAPin = req.body.twoFAPin;
  const name = req.body.name;
  const surname = req.body.surname;
  const email = req.body.email;
  const countryCode = req.body.countryCode;
  const phoneNumber = req.body.phoneNumber;
  const city = req.body.city;
  const country = req.body.country;
  const address = req.body.address;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const data = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (twoFAPin) data.twofa = twoFAPin;
  if (surname) data.surname = surname;
  if (countryCode) data.country_code = countryCode;
  if (phoneNumber) data.phone_number = phoneNumber;
  if (city) data.city = city;
  if (country) data.country = country;
  if (address) data.address = address;

  await UserModel.updateOne({ _id: userId }, data);
  return res.json({ status: "success", message: "User updated" });
};

module.exports = {
  BanUser,
  ReBanUser,
  editUser
};
