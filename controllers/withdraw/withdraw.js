const Wallet = require("../../models/Wallet");
const NotificationTokens = require("../../models/NotificationTokens");
const Withdraws = require("../../models/Withdraw");
var notifications = require("../../notifications.js");
var authFile = require("../../auth.js");
const axios = require("axios");

function PostRequestSync(url, data) {
  return new Promise((resolve, reject) => {
    
    axios.post(url, data).then(response => resolve(response)).catch(error => reject(error));
  });
}

const withdraw = async (req, res) => {
  var user_id = req.body.user_id;
  var coin_id = req.body.coin_id;
  var to = req.body.to;
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

  res.json({ status: "success", data: "TEST" });
  return;

  console.log("111");
  console.log({ from: process.env.TRCADDR, to: to, pkey: process.env.TRCPKEY, amount: (amount * 1000000) });
  let usdt_transaction = await PostRequestSync("http://54.172.40.148:4456/transfer", { from: process.env.TRCADDR, to: to, pkey: process.env.TRCPKEY, amount: (amount * 1000000).toString() });
  console.log("222");
  console.log(usdt_transaction.data);
  if (usdt_transaction.data.status != 'success') {
    console.log(usdt_transaction.data);
    res.json({ status: "fail", msg: "unknow error" });
    return;
  }

  let data = new Withdraws({
    user_id: user_id,
    coin_id: fromWalelt.coin_id,
    amount: amount,
    to: to,
    fee: 0.0,
    tx_id : usdt_transaction.data.data,
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
