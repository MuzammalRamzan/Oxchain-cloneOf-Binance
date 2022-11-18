const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");

const cancelFutureLimit = async function (req, res) {
  
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
    
    let userBalance = await FutureWalletModel.findOne({
      user_id: doc.user_id,
    }).exec();

    userBalance.amount = userBalance.amount + doc.usedUSDT;
    await userBalance.save();
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
    let userBalance = await FutureWalletModel.findOne({
      user_id: doc.user_id,
    }).exec();

    userBalance.amount = userBalance.amount + doc.usedUSDT;
    await userBalance.save();
  }

  res.json({ status: "success", message: "removed" });
};

module.exports = cancelFutureLimit;
