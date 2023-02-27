const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
const Orders = require("../../models/Orders");
const axios = require("axios");
var authFile = require("../../auth.js");
const CopyTradeModel = require("../../models/CopyTrade");
const setFeeCredit = require("../bonus/setFeeCredit");
const ApiRequest = require("../../models/ApiRequests");
const ApiKeysModel = require("../../models/ApiKeys");
const TradeVolumeModel = require("../../models/TradeVolumeModel");
const SetTradeVolumeAndRefProgram = require("../../Functions/setTradeVolumeAndRefProgram");
const AddMarketBuyOrder = require("../../Functions/Spot/Order/add_market_buy_order");
const AddMarketSellOrder = require("../../Functions/Spot/Order/add_market_sell_order");
const AddLimitBuyOrder = require("../../Functions/Spot/Order/add_limit_buy_order");
const AddLimitSellOrder = require("../../Functions/Spot/Order/add_limit_sell_order");
const AddStopLimitBuyOrder = require("../../Functions/Spot/Order/add_stop_limit_buy_order");
const AddStopLimitSellOrder = require("../../Functions/Spot/Order/add_stop_limit_sell_order");





const addOrders = async function (req, res) {
  try {

    var api_key_result = req.body.api_key;

    let api_result = await authFile.apiKeyChecker(api_key_result);
    let apiRequest = "";

    if (api_result === false) {
      let checkApiKeys = "";

      checkApiKeys = await ApiKeysModel.findOne({
        api_key: api_key_result,
        trade: "1"
      }).exec();

      if (checkApiKeys != null) {

        apiRequest = new ApiRequest({
          api_key: api_key_result,
          request: "addOrders",
          ip: req.body.ip ?? req.connection.remoteAddress,
          user_id: checkApiKeys.user_id,
        });
        await apiRequest.save();
      }
      else {
        res.json({ status: "fail", message: "Forbidden 403" });
        return;
      }
    }

    let percent = req.body.percent;
    let amount = req.body.amount;

    var getPair = await Pairs.findOne({ name: req.body.pair_name }).exec();

    if (getPair == null || getPair == undefined || getPair == "") {
      return res.json({ status: "fail", message: "pair_not_found" });
    }



    if (amount <= 0 || percent <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return;
    }

    var urlPair = req.body.pair_name.replace("/", "");
    let url =
      'http://18.170.26.150:8542/price?symbol=' + urlPair;
    let result = await axios(url);
    var price = result.data.data.ask;

    let target_price = req.body.target_price ?? 0.0;

    let followerList = await CopyTradeModel.find({
      traderId: req.body.user_id,
      status: "1",
    });

    if (followerList.length > 0) {
      followerList.forEach(async (follower) => {
        let followerWallet = await Wallet.findOne({
          user_id: follower.followerId,
          coin_id: getPair.symbolOneID,
        }).exec();
        if (followerWallet) {
          //burada kullanıcıya trade işlemi yaptırılacak, bakiye düşecek
          //trade tablosuna insert yapıcaz
        }
      });
    }

    //MARKET ORDERS
    if (req.body.type == 'market') {
      if (req.body.method == "buy") {
        return await AddMarketBuyOrder(req, res, getPair, price);
      } else if (req.body.method == "sell") {
        return await AddMarketSellOrder(req, res, getPair, price);
      }
    }

    //LIMIT ORDERS
    if (req.body.type == 'limit') {

      if (req.body.target_price == undefined || req.body.target_price == null || req.body.target_price == "") {
        return res.json({ status: "fail", message: "Please enter target price" });
      }
      if (req.body.method == "buy") {
        if (target_price >= price) {
          return await AddMarketBuyOrder(req, res, getPair, target_price);
        } else {
          return await AddLimitBuyOrder(req, res, getPair, api_result, apiRequest);
        }

      } else if (req.body.method == "sell") {
        if (target_price <= price) {
          return await AddMarketSellOrder(req, res, getPair, target_price);
        } else {
          return await AddLimitSellOrder(req, res, getPair, api_result, apiRequest);
        }
      }
    }

    //STOP LIMIT ORDERS
    if (req.body.type == 'stop_limit') {
      if (req.body.stop_limit == undefined || req.body.stop_limit == null || req.body.stop_limit == "") {
        res.json({ status: "fail", message: "Please enter stop limit" });
        return;
      }

      if (req.body.target_price == undefined || req.body.target_price == null || req.body.target_price == "") {
        res.json({ status: "fail", message: "Please enter target price" });
        return;
      }

      if (req.body.stop_limit <= 0) {
        res.json({ status: "fail", message: "Please enter stop limit" });
        return;
      }

      if (req.body.method == "buy") {
        return await AddStopLimitBuyOrder(req,res,getPair, api_result, apiRequest, price);
      }

      else if (req.body.method == "sell") {
        return await AddStopLimitSellOrder(req,res,getPair, api_result, apiRequest, price);
      }


    }


  } catch (err) {
    console.log(err);
    res.json({ status: "fail", message: "unknow_error" });
  }
};
function splitLengthNumber(q) {
  return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}

module.exports = addOrders;




