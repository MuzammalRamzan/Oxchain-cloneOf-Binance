const Pairs = require("../../models/Pairs");
const axios = require("axios");
var authFile = require("../../auth.js");
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");


const closeFutureOrder = async (req, res) => {
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
    
    let getOrderDetail = await FutureOrder.findOne({ _id: orderId }).exec();
    let getPair = await Pairs.findOne({ _id: getOrderDetail.pair_id }).exec();
    var urlPair = getPair.name.replace("/", "");
    
    let url =
      'http://global.oxhain.com:8542/price?symbol=' + urlPair;
    result = await axios(url);
    var price = result.data.data.ask;
    let doc = await FutureOrder.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: 1, close_time: Date.now(), close_price: price } }
    );
    if (doc.status == 1) {
      res.json({ status: "fail", message: "Order is closed" });
      return;
    }
    if (doc.margin_type == "isolated") {
        
      let marginWallet = await FutureWalletModel.findOne({
        user_id: doc.user_id,
      }).exec();
      marginWallet.amount = marginWallet.amount + (doc.pnl + doc.usedUSDT);
      await marginWallet.save();
    } else {
      let marginWallet = await FutureWalletModel.findOne({
        user_id: doc.user_id,
      }).exec();

      marginWallet.pnl = marginWallet.pnl - doc.pnl;
      marginWallet.amount = marginWallet.amount + doc.pnl + doc.usedUSDT;
      await marginWallet.save();
    }


    res.json({ status: "success", data: doc });
  } catch (err) {
    console.log(err);
    res.json({ status: "fail", msg: err.message });

  }
};

module.exports = closeFutureOrder;
