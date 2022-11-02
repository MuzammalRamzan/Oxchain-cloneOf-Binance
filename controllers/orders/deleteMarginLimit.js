const MarginOrder = require("../../models/MarginOrder");
const Wallet = require("../../models/Wallet");

const MarginWalletId = "62ff3c742bebf06a81be98fd";
const deleteMarginLimit = async function (req, res) {
  let doc = await MarginOrder.findOneAndUpdate(
    {
      _id: req.body.order_id,
      user_id: req.body.user_id,
      method: "limit",
      status: 1,
    },
    { $set: { status: -1 } }
  ).exec();
  if (doc) {
    let userBalance = await Wallet.findOne({
      coin_id: MarginWalletId,
      user_id: doc.user_id,
    }).exec();

    userBalance.amount = userBalance.amount + doc.usedUSDT;
    await userBalance.save();
  }
  doc = await MarginOrder.findOneAndUpdate(
    {
      _id: req.body.order_id,
      user_id: req.body.user_id,
      method: "stop_limit",
      status: 1,
    },
    { $set: { status: -1 } }
  ).exec();
  if (doc) {
    let userBalance = await Wallet.findOne({
      coin_id: MarginWalletId,
      user_id: doc.user_id,
    }).exec();

    userBalance.amount = userBalance.amount + doc.usedUSDT;
    await userBalance.save();
  }

  res.json({ status: "success", message: "removed" });
};

module.exports = deleteMarginLimit;
