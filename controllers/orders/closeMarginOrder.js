const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
const axios = require("axios");
var authFile = require("../../auth.js");
const MarginOrder = require("../../models/MarginOrder");

const MarginWalletId = "62ff3c742bebf06a81be98fd";

const closeMarginOrder = async (req, res) => {
  try {
    var api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result !== true) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }
    let orderId = req.body.order_id ?? null;
    if (orderId == null) {
      res.json({ status: "fail", message: "invalid_order" });
      return;
    }
    let getOrderDetail = await MarginOrder.findOne({ _id: orderId }).exec();
    let getPair = await Pairs.findOne({ _id: getOrderDetail.pair_id }).exec();
    var urlPair = getPair.name.replace("/", "");
    let url =
      'http://global.oxhain.com:8542/price?symbol=' + urlPair;
    result = await axios(url);
    var price = result.data.data.ask;
    let doc = await MarginOrder.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: 1, close_time: Date.now(), close_price: price } }
    );
    if (doc.status == 1) {
      res.json({ status: "fail", message: "Order is closed" });
      return;
    }
    if (doc.margin_type == "isolated") {
      let marginWallet = await Wallet.findOne({
        user_id: doc.user_id,
        coin_id: MarginWalletId,
      }).exec();
      marginWallet.amount = marginWallet.amount + (doc.pnl + doc.usedUSDT);
      await marginWallet.save();
    } else {
      let marginWallet = await Wallet.findOne({
        user_id: doc.user_id,
        coin_id: MarginWalletId,
      }).exec();

      marginWallet.pnl = marginWallet.pnl - doc.pnl;
      marginWallet.amount = marginWallet.amount + doc.pnl + doc.usedUSDT;
      await marginWallet.save();
    }


    res.json({ status: "success", data: doc });
  } catch (err) {}
};

module.exports = closeMarginOrder;
