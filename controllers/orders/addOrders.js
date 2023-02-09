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

    var fromWallet = await Wallet.findOne({
      coin_id: getPair.symbolOneID,
      user_id: req.body.user_id,
    }).exec();
    var towallet = await Wallet.findOne({
      coin_id: getPair.symbolTwoID,
      user_id: req.body.user_id,
    }).exec();


    if (amount <= 0 || percent <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return;
    }





    var urlPair = req.body.pair_name.replace("/", "");
    let url =
      'http://18.130.193.166:8542/price?symbol=' + urlPair;
    let result = await axios(url);
    var price = result.data.data.ask;

    let target_price = req.body.target_price ?? 0.0;
    let stop_limit = req.body.stop_limit ?? 0.0;
    var coins = req.body.pair_name.split("/");

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



    if (req.body.method == "buy") {
      let balance = towallet.amount;
      amount = (balance * percent / 100.0) / price;
      if (req.body.type == "stop_limit") {

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

        if (req.body.stop_limit < req.body.target_price) {
          res.json({ status: "fail", message: "The limit price cannot be more than the stop price Buy limit order must be below the price" });
          return;
        }

        if (req.body.target_price >= price) {
          res.json({ status: "fail", message: "Buy limit order must be below the price" });
          return;
        }


        let total = amount * stop_limit;

        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }

        if (stop_limit <= 0) {
          res.json({
            status: "fail",
            message: "Please enter stop limit",
          });
          return;
        }
        if (stop_limit < target_price) {
          res.json({
            status: "fail",
            message:
              "The limit price cannot be more than the stop price Buy limit order must be below the price",
          });
          return;
        }
        if (target_price >= price) {
          res.json({
            status: "fail",
            message: "Buy limit order must be below the price",
          });
          return;
        }
        total = amount * stop_limit;
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: amount,
          open_price: target_price,
          stop_limit: stop_limit,
          type: "stop_limit",
          method: "buy",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        if (saved) {
          towallet.amount = towallet.amount - total;
          await towallet.save();
          if (api_result === false) {
            apiRequest.status = 1;
            await apiRequest.save();
          }
          res.json({ status: "success", message: saved });
        }
      }
      else if (req.body.type == "limit") {
        if (req.body.target_price == undefined || req.body.target_price == null || req.body.target_price == "") {
          res.json({ status: "fail", message: "Please enter target price" });
          return;
        }

        if (req.body.target_price >= price) {
          res.json({ status: "fail", message: "Buy limit order must be below the price" });
          return;
        }

        if (target_price >= price) {
          res.json({
            status: "fail",
            message: "Buy limit order must be below the price",
          });
          return;
        }

        let total = amount * target_price;
        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          
          amount: amount,
          open_price: target_price,
          type: "limit",
          method: "buy",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        if (saved) {
          towallet.amount = towallet.amount - total;
          await towallet.save();
          if (api_result === false) {
            apiRequest.status = 1;
            await apiRequest.save();
          }
          res.json({ status: "success", message: saved });
        }
      } else if (req.body.type == "market") {
        let total = amount * price;

        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }
        if (balance >= total) {
          const fee = splitLengthNumber((total * getPair.spot_fee) / 100.0);
          const feeToAmount = splitLengthNumber((fee / price));
          const buyAmount = splitLengthNumber((amount - feeToAmount));

          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: buyAmount,
            open_price: price,
            feeUSDT: fee,
            feeAmount: feeToAmount,
            type: "market",
            method: "buy",
            target_price: req.body.target_price,
          });

          

          let saved = await orders.save();
          if (saved) {
            fromWallet.amount = parseFloat(fromWallet.amount) + parseFloat(buyAmount);
            towallet.amount = parseFloat(towallet.amount) - parseFloat(total);

            await fromWallet.save();
            await towallet.save();
            if (api_result === false) {
              apiRequest.status = 1;
              await apiRequest.save();
            }
            await SetTradeVolumeAndRefProgram({ order_id: saved._id, user_id: req.body.user_id, trade_from: "spot", trade_type: "buy", amount: amount, totalUSDT: splitLengthNumber(total) })
            await setFeeCredit(req.body.user_id, getPair.symbolTwoID, fee);
            res.json({ status: "success", message: saved });

          }
        } else {
          res.json({ status: "fail", message: "not_enougth_balance" });
        }
      }
    }

    if (req.body.method == "sell") {
      let balance = parseFloat(fromWallet.amount);
      amount = (fromWallet.amount * parseFloat(percent)) / 100.0;
      amount = splitLengthNumber(amount);
      //amount = parseFloat(req.body.amount);


      if (balance < amount) {
        res.json({ status: "fail", message: "Invalid  balance" });
        return;
      }
      if (req.body.type == "stop_limit") {
        if (req.body.target_price == undefined || req.body.target_price == null || req.body.target_price == "") {
          res.json({ status: "fail", message: "Please enter target price" });
          return;
        }
        if (req.body.stop_limit == undefined || req.body.stop_limit == null || req.body.stop_limit == "") {
          res.json({ status: "fail", message: "Please enter stop limit" });
          return;
        }

        target_price = req.body.target_price;
        let stop_limit = req.body.stop_limit ?? 0.0;
        if (stop_limit <= 0) {
          res.json({
            status: "fail",
            message: "Please enter stop limit",
          });
          return;
        }
        if (stop_limit > target_price) {
          res.json({
            status: "fail",
            message:
              "The limit price cannot be less than the stop price Sell limit order must be below the price",
          });
          return;
        }
        if (target_price <= price) {
          res.json({
            status: "fail",
            message: "Sell limit order must be above the price",
          });
          return;
        }
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: amount,
          open_price: target_price,
          stop_limit: stop_limit,
          type: "stop_limit",
          method: "sell",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        if (saved) {
          fromWallet.amount = fromWallet.amount - amount;
          await fromWallet.save();
          if (api_result === false) {
            apiRequest.status = 1;
            await apiRequest.save();
          }
          res.json({ status: "success", message: saved });
        }
      }
      if (req.body.type == "limit") {
        if (req.body.target_price == undefined || req.body.target_price == null || req.body.target_price == "") {
          res.json({ status: "fail", message: "Please enter target price" });
          return;
        }


        target_price = req.body.target_price;
        if (target_price <= price) {
          res.json({
            status: "fail",
            message: "Sell limit order must be below the price",
          });
          return;
        }
        const orders = new Orders({
          pair_id: getPair.symbolOneID,
          second_pair: getPair.symbolTwoID,
          pair_name: getPair.name,
          user_id: req.body.user_id,
          amount: amount,
          open_price: target_price,
          type: "limit",
          method: "sell",
          target_price: req.body.target_price,
          status: 1,
        });

        let saved = await orders.save();
        if (saved) {
          fromWallet.amount = fromWallet.amount - amount;
          await fromWallet.save();
          if (api_result === false) {
            apiRequest.status = 1;
            await apiRequest.save();
          }
          res.json({ status: "success", message: saved });
        }
      } else if (req.body.type == "market") {

        if (balance >= amount) {

          let total = amount * price;
          const fee = splitLengthNumber((total * getPair.spot_fee) / 100.0);
          const feeToAmount = splitLengthNumber((fee / price));
          const sellAmount = splitLengthNumber((amount - feeToAmount));
          const addUSDTAmount = splitLengthNumber(parseFloat(sellAmount) * price);
          
          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: sellAmount,
            open_price: price,
            feeUSDT: fee,
            feeAmount: feeToAmount,
            type: "market",
            method: "sell",
            target_price: req.body.target_price,
          });

          let saved = await orders.save();
          if (saved) {
            fromWallet.amount = fromWallet.amount - amount;
            towallet.amount = towallet.amount + parseFloat(addUSDTAmount);
            await fromWallet.save();
            await towallet.save();

            if (api_result === false) {
              apiRequest.status = 1;
              await apiRequest.save();
            }
            await SetTradeVolumeAndRefProgram({ order_id: saved._id, user_id: req.body.user_id, trade_from: "spot", trade_type: "sell", amount: amount, totalUSDT: splitLengthNumber(total) });
            await setFeeCredit(req.body.user_id, getPair.symbolTwoID, fee);
            res.json({ status: "success", message: saved });
          }
        } else {
          res.json({ status: "fail", message: "invalid_balance" });
        }
      }
    }

    if (req.body.amount <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
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




