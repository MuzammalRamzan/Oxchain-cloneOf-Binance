const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
const Orders = require("../../models/Orders");

const cancelAllStopLimit = async function (req, res) {
  var user_id = req.body.user_id;
  let orders = await Orders.findAll({
    _id: req.body.order_id,
    user_id: req.body.user_id,
    type: "stop_limit",
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
};

module.exports = cancelAllStopLimit;