const User = require("../models/User");
const EarningModel = require("../models/Earning");
const DepositsModel = require("../models/Deposits");
const WithdrawModel = require("../models/Withdraw");
const OrderModel = require("../models/Orders");

var authFile = require("../auth.js");

const getData = async (req, res) => {
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

  let myData = [];
  //earning modelindeki amountları topluyoruz

  //sum of amount

  var sumOfAmount = await EarningModel.aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  var totalEarning = sumOfAmount[0].total;

  //total earnings today

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();

  today = yyyy + "-" + mm + "-" + dd;

  var sumOfAmountToday = await EarningModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(today),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  var totalEarningToday = sumOfAmountToday[0].total;

  //total earnings this month

  var sumOfAmountThisMonth = await EarningModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(today),
        },
      },
    },

    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  var totalEarningThisMonth = sumOfAmountThisMonth[0].total;

  var deposits = await DepositsModel.find({});
  var depositCount = deposits.length;

  var withdraws = await WithdrawModel.find({});
  var withdrawCount = withdraws.length;

  var users = await User.find({});
  var userCount = users.length;

  var orders = await OrderModel.find({});
  var orderCount = orders.length;

  myData.push({
    totalEarning: totalEarning,
    depositCount: depositCount,
    withdrawCount: withdrawCount,
    userCount: userCount,
    totalEarningToday: totalEarningToday,
    totalEarningThisMonth: totalEarningThisMonth,
    orderCount: orderCount,
  });

  res.json({
    status: "success",
    message: "Data is listed",
    data: myData,
  });
};

module.exports = { getData };
