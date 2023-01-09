const Wallet = require("../../models/Wallet");
const NotificationTokens = require("../../models/NotificationTokens");
const Withdraws = require("../../models/Withdraw");
var notifications = require("../../notifications.js");
var authFile = require("../../auth.js");
const axios = require("axios");
const Network = require("../../models/Network");
const CoinList = require("../../models/CoinList");

function PostRequestSync(url, data) {
  return new Promise((resolve, reject) => {

    axios.post(url, data).then(response => resolve(response)).catch(error => reject(error));
  });
}

const withdraw = async (req, res) => {
  var user_id = req.body.user_id;
  var coin_id = req.body.coin_id;
  var network_id = req.body.network_id;
  var to = req.body.toAddress;
  var amount = req.body.amount;
  var api_key_result = req.body.api_key;
  /*
  var api_result = await authFile.apiKeyChecker(api_key_result);
  if (api_result === false) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }
  */

  amount = parseFloat(amount);
  var fromWalelt = await Wallet.findOne({
    coin_id: coin_id,
    user_id: user_id,
  }).exec();
  if (fromWalelt == null) {
    console.log("cuzdan yok");
    res.json({ status: "fail", message: "unknow_error" });
    return;
  }
  let networkInfo = await Network.findOne({ _id: network_id });
  if (networkInfo == null) {
    res.json({ status: "fail", message: "Network not found" });
    return;
  }
  let balance = parseFloat(fromWalelt.amount);
  if (amount <= 0) {
    res.json({ status: "fail", message: "invalid_amount" });
    return;
  }
  console.log("Balance : ", balance);
  if (balance <= amount) {
    res.json({ status: "fail", message: "invalid_balance" });
    return;
  }

  let transaction = null;
  let coinInfo = null;
  switch (networkInfo.symbol) {
    case "TRC":
      transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { from: process.env.TRCADDR, to: to, pkey: process.env.TRCPKEY, amount: (amount * 1000000).toString() });
      console.log(transaction.data);
      if (transaction.data.status != 'success') {
        res.json({ status: "fail", msg: "unknow error" });
        return;
      }
      break;
    case "BSC":
      coinInfo = await CoinList.findOne({ _id: coin_id });
      if (coinInfo.symbol == 'BNB') {
        console.log({ from: process.env.BNBADDR, to: to, pkey: process.env.BNBPKEY, amount: amount });
        transaction = await PostRequestSync("http://44.203.2.70:4458/transfer", { from: process.env.BSCADDR, to: to, pkey: process.env.BSCPKEY, amount: amount });
        console.log(transaction.data);
        if (transaction.data.status != 'success') {
          res.json({ status: "fail", msg: "unknow error" });
          return;
        }
      }

      break;
    case "ERC":
      coinInfo = await CoinList.findOne({ _id: coin_id });
      transaction = await PostRequestSync("http://54.167.28.93:4455/transfer", {  from: process.env.ERCADDR, to: to, pkey: process.env.ERCPKEY, amount: amount });
      console.log(transaction.data);
      if (transaction.data.status != 'success') {
        res.json({ status: "fail", msg: "unknow error" });
        return;
      }
      break;
    case "SEGWIT":
      transaction = await axios.request({
        method: "post",
        url: "http://3.15.2.155",
        data: "request=transfer&to=" + to + "&amount=" + amount,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log(transaction.data);
      if (transaction.data.status != 'success') {
        res.json({ status: "fail", msg: transaction.data.message });
        return;
      }
      break;
    default:
      res.json({ status: "fail", msg: "Invalid network" });
      break;
  }


  let data = new Withdraws({
    user_id: user_id,
    coin_id: fromWalelt.coin_id,
    amount: amount,
    to: to,
    fee: 0.0,
    tx_id: ""
  });

  await data.save();

  fromWalelt.amount = parseFloat(fromWalelt.amount) - amount;
  await fromWalelt.save();
  let response = await NotificationTokens.findOne({
    user_id: user_id,
  });

  if (response == null) {
  } else {
    var token = response["token_id"];
    var body =
      "A withdraw order has been given from your account. Please wait for the admin to confirm your order.\n\n";
    notifications.sendPushNotification(token, body);
  }
  res.json({ status: "success", data: data });

};

module.exports = withdraw;
