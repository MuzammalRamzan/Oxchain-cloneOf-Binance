const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");
var authFile = require("../../auth.js");

const cancelFutureLimit = async function (req, res) {

  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);
  if (result == false) {
    res.json({ status: "false", message: "Forbidden 403" });
    return;
  }

  let doc = await FutureOrder.findOneAndUpdate(
    {
      _id: req.body.order_id,
      user_id: req.body.user_id,
      method: "limit",
      status: 1,
    },
    { $set: { status: -1 } }
  ).exec();
  if (doc) {
    if (doc.relevant_order_id == null) {
      let userBalance = await FutureWalletModel.findOne({
        user_id: doc.user_id,
      }).exec();

      userBalance.amount = userBalance.amount + doc.usedUSDT;
      await userBalance.save();
    }
  }
  doc = await FutureOrder.findOneAndUpdate(
    {
      _id: req.body.order_id,
      user_id: req.body.user_id,
      method: "stop_limit",
      status: 1,
    },
    { $set: { status: -1 } }
  ).exec();
  if (doc) {
    if (doc.relevant_order_id == null) {
      let userBalance = await FutureWalletModel.findOne({
        user_id: doc.user_id,
      }).exec();

      userBalance.amount = userBalance.amount + doc.usedUSDT;
      await userBalance.save();
    }
  }

  res.json({ status: "success", message: "removed" });
};

module.exports = cancelFutureLimit;
