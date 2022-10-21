const Wallet = require("../../models/Wallet");
const NotificationTokens = require("../../models/NotificationTokens");
const Withdraws = require("../../models/Withdraw");
var notifications = require("../../notifications.js");

const withdraw = async (req, res) => {
  var user_id = req.body.user_id;
  var address = req.body.address;
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

  var fromWalelt = await Wallet.findOne({
    address: address,
    user_id: user_id,
  }).exec();
  if (fromWalelt == null) {
    console.log("cuzdan yok");
    res.json({ status: "fail", message: "unknow_error" });
    return;
  }
  let balance = fromWalelt.amount;
  if (amount <= 0) {
    res.json({ status: "fail", message: "invalid_amount" });
    return;
  }
  console.log("Balance : ", balance);
  if (balance <= amount) {
    res.json({ status: "fail", message: "invalid_balance" });
    return;
  }

  let data = new Withdraws({
    user_id: user_id,
    coin_id: fromWalelt.coin_id,
    amount: amount,
    to: to,
    fee: 0.0,
  });

  await data.save();
  fromWalelt.amount = fromWalelt.amount - amount;
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
