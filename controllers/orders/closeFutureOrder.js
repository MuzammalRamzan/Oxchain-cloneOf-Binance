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

    let key = req.headers["key"];

    if (!key) {
      return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
      return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
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

      let usedUSDT = doc.usedUSDT;
      let leverage = doc.leverage;
      let type = doc.type;

      const fee = usedUSDT * leverage * (type == 'buy' ? 0.03 : 0.06) / 100.0;

      console.log("buradayız");

      let newType = "";
      if (doc.type == "buy") {
        newType = "sell";
      } else {
        newType = "buy";
      }

      //add new future order but closed 
      let newOrder = new FutureOrder({
        user_id: doc.user_id,
        pair_id: doc.pair_id,
        type: newType,
        method: doc.method,
        open_price: doc.open_price,
        amount: doc.amount,
        leverage: doc.leverage,
        liqPrice: doc.liqPrice,
        required_margin: doc.required_margin,
        usedUSDT: doc.usedUSDT,
        pnl: 0,
        status: 1,
      });

      await newOrder.save();

      marginWallet.amount = marginWallet.amount + doc.pnl + doc.usedUSDT - fee;
      await marginWallet.save();
    } else {
      let marginWallet = await FutureWalletModel.findOne({
        user_id: doc.user_id,
      }).exec();


      let usedUSDT = doc.usedUSDT;
      let leverage = doc.leverage;
      let type = doc.type;

      const fee = usedUSDT * leverage * (type == 'buy' ? 0.03 : 0.06) / 100.0;


      //add new future order but closed 
      let newOrder = new FutureOrder({
        user_id: doc.user_id,
        pair_id: doc.pair_id,
        type: doc.type == "buy" ? "sell" : "buy",
        method: doc.method,
        open_price: doc.open_price,
        amount: doc.amount,
        leverage: doc.leverage,
        liqPrice: doc.liqPrice,
        required_margin: doc.required_margin,
        usedUSDT: doc.usedUSDT,
        pnl: 0,
        status: 1,
      });

      await newOrder.save();

      marginWallet.pnl = marginWallet.pnl - doc.pnl;
      marginWallet.amount = marginWallet.amount + doc.pnl + doc.usedUSDT - fee;
      await marginWallet.save();
    }


    res.json({ status: "success", data: doc });
  } catch (err) {
    console.log(err);
    res.json({ status: "fail", msg: err.message });

  }
};

module.exports = closeFutureOrder;
