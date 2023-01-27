const Admin = require("../models/Admin");
const ProfitModel = require("../models/FeeModel");

var authFile = require("../auth.js");
var utilities = require("../utilities.js");
var User = require("../models/User");

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


  //make pagination here
  let page = req.body.page;
  let limit = req.body.limit;

  if (page == null) {
    page = 1;
  }

  if (limit == null) {
    limit = 10;
  }

  let profit = await ProfitModel.find()
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });



  if (profit == null) {
    return res.json({
      status: "error",
      message: "Profit is null",
    });
  }

  let myData = [];
  for (var i = 0; i < profit.length; i++) {
    var from_user = await User.findOne({ _id: profit[i].from_user_id });
    var to_user = await User.findOne({ _id: profit[i].to_user_id });

    if (from_user == null || to_user == null) {

    }


    let myDataItem = {
      _id: profit[i]._id,
      from_user_id: profit[i].from_user_id,
      from_user_data: "",
      to_user_id: profit[i].to_user_id,
      to_user_data: "",
      amount: profit[i].amount,
      createdAt: profit[i].createdAt,
      feeType: profit[i].feeType,
    };

    if (from_user != null) {
      myDataItem.from_user_data = from_user.email;
    }

    if (to_user != null) {
      myDataItem.to_user_data = to_user.email;
    }

    myData.push(myDataItem);
  }


  return res.json({
    status: "success",
    message: "Profit is listed",
    data: myData,
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
