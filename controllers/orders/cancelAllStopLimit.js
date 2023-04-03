const MarginOrder = require("../../models/MarginOrder");
const Orders = require("../../models/Orders");
const Pairs = require("../../models/Pairs");
const Wallet = require("../../models/Wallet");
var authFile = require("../../auth");

const cancelAllStopLimit = async function (req, res) {

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {


    let key = req.headers["key"];

    if (!key) {
      return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
      return res.json({ status: "fail", message: "invalid_params" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
    }


    var user_id = req.body.user_id;

    let orders = await Orders.find({
      _id: req.body.order_id,
      user_id: req.body.user_id,
      type: "stop_limit",
      status: 1
    }).exec();
    for (var i = 0; i < orders.length; i++) {
      let order = orders[i];
      let amount = order.amount;
      let pair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();

      if (order.method == "buy") {
        var toWallet = await Wallet.findOne({
          coin_id: pair.symbolTwoID,
          user_id: order.user_id,
        }).exec();
        toWallet.amount = toWallet.amount + order.target_price * amount;
        await toWallet.save();
      } else {
        var toWallet = await Wallet.findOne({
          coin_id: pair.symbolOneID,
          user_id: order.user_id,
        }).exec();
        toWallet.amount = toWallet.amount + amount;
        await toWallet.save();
      }
    }
  }
  else {
    return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = cancelAllStopLimit;
