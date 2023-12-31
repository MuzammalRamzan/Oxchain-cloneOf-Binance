const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
const Orders = require("../../models/Orders");
var authFile = require("../../auth");


const deleteLimit = async (req, res) => {



  let key = req.headers["key"];

  if (!key) {
    return res.json({ status: "fail", message: "key_not_found" });
  }

  if (!req.body.device_id || !req.body.user_id) {
    return res.json({ status: "fail", message: "invalid_params (key, user id, device id)" });
  }

  let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


  if (checkKey === "expired") {
    return res.json({ status: "fail", message: "key_expired" });
  }

  if (!checkKey) {
    return res.json({ status: "fail", message: "invalid_key" });
  }

  let order = await Orders.findOne({
    _id: req.body.order_id,
    user_id: req.body.user_id,
    status: 1,
    type: "limit",
  }).exec();
  if (order) {
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

  order = await Orders.findOne({
    _id: req.body.order_id,
    user_id: req.body.user_id,
    type: "stop_limit",
  }).exec();

  if (order) {
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

  await Orders.findOneAndUpdate(
    { _id: req.body.order_id, user_id: req.body.user_id, type: "limit" },
    { $set: { status: -1 } }
  ).exec();
  await Orders.findOneAndUpdate(
    { _id: req.body.order_id, user_id: req.body.user_id, type: "stop_limit" },
    { $set: { status: -1 } }
  ).exec();
  res.json({ status: "success", message: "removed" });
};

module.exports = deleteLimit;