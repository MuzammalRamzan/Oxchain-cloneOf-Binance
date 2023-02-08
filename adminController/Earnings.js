const Admin = require("../models/Admin");

const Blogs = require("../models/Blogs");

const User = require("../models/User");
var authFile = require("../auth.js");

const EarningModel = require("../models/Earning");

const getEarnings = async (req, res) => {
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

  var earnings = await EarningModel.find({});

  let myData = [];
  for (var i = 0; i < earnings.length; i++) {
    var user = await User.findOne({ _id: earnings[i].user_id });
    if (!user) continue;
    let name = "";
    let surname = "";
    let email = "";

    if (user.name) {
      name = user.name;
    }

    if (user.surname) {
      surname = user.surname;
    }

    if (user.email) {
      email = user.email;
    }



    myData.push({
      user_id: earnings[i].user_id,
      amount: earnings[i].amount,
      type: earnings[i].type,
      status: earnings[i].status,
      createdAt: earnings[i].createdAt,
      user_name: name + " " + surname,
      user_mail: email,
    });
  }

  res.json({
    status: "success",
    message: "Earnings are listed",
    data: myData,
  });
};

const AddEarning = async (req, res) => {
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

  var user_id = req.body.user_id;
  var amount = req.body.amount;
  var type = req.body.type;

  if (!user_id || !amount || !type) {
    return res.json({
      status: "error",
      message: "Please fill all fields",
    });
  }

  let newData = new EarningModel({
    user_id: user_id,
    amount: amount,
    type: type,
  });

  await newData.save();

  res.json({
    status: "success",
    message: "Earning is added",
  });
};

module.exports = { getEarnings, AddEarning };
