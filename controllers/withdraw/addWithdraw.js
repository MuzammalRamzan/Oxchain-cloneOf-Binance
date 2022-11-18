const Wallet = require("../../models/Wallet");
const NotificationTokens = require("../../models/NotificationTokens");
const Withdraws = require("../../models/Withdraw");
var authFile = require("../../auth.js");
var notifications = require("../../notifications.js");

const addWithdraw = (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var amount = req.body.amount;
  var currency = req.body.currency;
  var withdraw_address = req.body.to;
  var coin_id = req.body.coin_id;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    console.log(result);
    if (result === true) {
      Wallet.findOne({ user_id: user_id, coin_id: coin_id }, { amount: 1 })
        .then((list) => {
          if (list == null) {
            console.log("liste yok");
            res.json({ status: "fail", message: "unknow_error" });
            return;
          }
          if (list.amount >= amount) {
            const newWithdraw = new Withdraws({
              user_id: user_id,
              coin_id: coin_id,
              amount: amount,
              to: withdraw_address,
              status: 1,
            });
            console.log(newWithdraw);
            NotificationTokens.findOne({
              user_id: user_id,
            }).then((response) => {
              console.log(response);
              if (response == null) {
              } else {
                var token = response["token_id"];
                newWithdraw.save(function (err, room) {
                  if (err) {
                    res.json({ status: "fail", message: err });
                    return;
                  } else {
                    var body =
                      "A withdraw order has been given from your account. Please wait for the admin to confirm your order.\n\n";
                    notifications.sendPushNotification(token, body);
                    res.json({ status: "success", data: "" });
                    return;
                  }
                });
              }
            });
          } else {
            res.json({ status: "fail", message: "not_enough_balance" });
            return;
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.json({ status: "fail", message: "403 Forbidden" });
    }
  });
};

module.exports = addWithdraw;
