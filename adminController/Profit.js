const Admin = require("../models/Admin");
const ProfitModel = require("../models/FeeModel");

var authFile = require("../auth.js");
var utilities = require("../utilities.js");

const ProfitAll = async (req, res) => {
  //api key kontrolü yapılacak

  var apiKey = req.body.apiKey;

  if (apiKey == null) {
    return res.json({
      status: "error",
      message: "Api key is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var profit = await ProfitModel.find();

  if (profit == null) {
    return res.json({
      status: "error",
      message: "Profit is null",
    });
  }

  res.json({
    status: "success",
    message: "Profit is listed",
    data: profit,
  });
};

const ProfitByUser = async (req, res) => {
  //api key kontrolü yapılacak

  let user_id = req.body.user_id;
  var apiKey = req.body.apiKey;

  if (apiKey == null) {
    return res.json({
      status: "error",
      message: "Api key is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var profit = await ProfitModel.find({ user_id: user_id });

  if (profit == null) {
    return res.json({
      status: "error",
      message: "Profit is null",
    });
  }

  res.json({
    status: "success",
    message: "Profit is listed",
    data: profit,
  });
};

const ProfitAllByFeeType = async (req, res) => {
  //api key kontrolü yapılacak

  let feeType = req.body.feeType;

  let user_id = req.body.user_id;
  var apiKey = req.body.apiKey;

  if (apiKey == null) {
    return res.json({
      status: "error",
      message: "Api key is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var profit = await ProfitModel.find({ feeType: feeType });

  if (profit == null) {
    return res.json({
      status: "error",
      message: "Profit is null",
    });
  }

  res.json({
    status: "success",
    message: "Profit is listed",
    data: profit,
  });
};

const ProfitUserByFeeType = async (req, res) => {
  //api key kontrolü yapılacak

  let feeType = req.body.feeType;

  let user_id = req.body.user_id;
  var apiKey = req.body.apiKey;

  if (apiKey == null) {
    return res.json({
      status: "error",
      message: "Api key is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var profit = await ProfitModel.find({ feeType: feeType, user_id: user_id });

  if (profit == null) {
    return res.json({
      status: "error",
      message: "Profit is null",
    });
  }

  res.json({
    status: "success",
    message: "Profit is listed",
    data: profit,
  });
};

module.exports = { ProfitAll, ProfitByUser, ProfitAllByFeeType };
