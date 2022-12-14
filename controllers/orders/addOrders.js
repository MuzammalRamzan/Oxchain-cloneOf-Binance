const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
const Orders = require("../../models/Orders");
const axios = require("axios");
var authFile = require("../../auth.js");
const CopyTradeModel = require("../../models/CopyTrade");
const setFeeCredit = require("../bonus/setFeeCredit");

const addOrders = async function (req, res) {
  try {
    
    var api_key_result = req.body.api_key;

    let api_result = await authFile.apiKeyChecker(api_key_result);
    if (api_result === false) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }
    let percent = req.body.percent;
    let amount = req.body.amount;

    var getPair = await Pairs.findOne({ name: req.body.pair_name }).exec();
    var fromWalelt = await Wallet.findOne({
      coin_id: getPair.symbolOneID,
      user_id: req.body.user_id,
    }).exec();
    var toWalelt = await Wallet.findOne({
      coin_id: getPair.symbolTwoID,
      user_id: req.body.user_id,
    }).exec();

    console.log(fromWalelt);

    if (amount <= 0 || percent <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return;
    }

    const fee = (amount * getPair.tradeFee) / 100;

    var urlPair = req.body.pair_name.replace("/", "");
    let url =
      'http://18.130.193.166:8542/price?symbol=' + urlPair;
    let result = await axios(url);
    var price = result.data.data.ask;
    
    console.log(price);
    let target_price = req.body.target_price ?? 0.0;
    let stop_limit = req.body.stop_limit ?? 0.0;
    var coins = req.body.pair_name.split("/");

    console.log(req.body.user_id);
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

    console.log("Followers:" + followerList);

    if (req.body.method == "buy") {
      if (req.body.type == "stop_limit") {
        console.log("Stop limit : ", stop_limit);
        let total = amount * stop_limit;
        let balance = toWalelt.amount;

        console.log(balance, " | ", total);
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
        console.log(target_price, " | ", stop_limit);
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
        console.log(saved);
        if (saved) {
          toWalelt.amount = toWalelt.amount - total;
          await toWalelt.save();
          res.json({ status: "success", message: saved });
        }
      }
      if (req.body.type == "limit") {
        let total = amount * target_price;
        let balance = toWalelt.amount;
        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }
        target_price = req.body.target_price;
        if (target_price >= price) {
          res.json({
            status: "fail",
            message: "Buy limit order must be below the price",
          });
          return;
        }
        total = amount * target_price;
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
          toWalelt.amount = toWalelt.amount - total;
          await toWalelt.save();
          res.json({ status: "success", message: saved });
        }
      } else if (req.body.type == "market") {
        let total = amount * price;
        let balance = toWalelt.amount;

        if (balance < total) {
          res.json({ status: "fail", message: "Invalid  balance" });
          return;
        }
        if (balance >= total) {
          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: amount,
            open_price: price,
            type: "market",
            method: "buy",
            target_price: req.body.target_price,
          });

          let saved = await orders.save();
          if (saved) {
            fromWalelt.amount =
              parseFloat(fromWalelt.amount) + parseFloat(amount) - parseFloat(fee);
            toWalelt.amount = parseFloat(toWalelt.amount) - parseFloat(total);

            await fromWalelt.save();
            await toWalelt.save();
            res.json({ status: "success", message: saved });
          }
        } else {
          res.json({ status: "fail", message: "not_enougth_balance" });
        }
      }
    }

    if (req.body.method == "sell") {
      let balance = fromWalelt.amount;
      amount = (fromWalelt.amount * percent) / 100;
      console.log(balance, " | ", amount);
      if (balance < amount) {
        res.json({ status: "fail", message: "Invalid  balance" });
        return;
      }
      if (req.body.type == "stop_limit") {
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
          fromWalelt.amount = fromWalelt.amount - amount;
          await fromWalelt.save();
          res.json({ status: "success", message: saved });
        }
      }
      if (req.body.type == "limit") {
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
          fromWalelt.amount = fromWalelt.amount - amount;
          await fromWalelt.save();
          res.json({ status: "success", message: saved });
        }
      } else if (req.body.type == "market") {
        let balance = fromWalelt.amount;

        if (balance >= amount) {
          let total = amount * price;
          const orders = new Orders({
            pair_id: getPair.symbolOneID,
            second_pair: getPair.symbolTwoID,
            pair_name: getPair.name,
            user_id: req.body.user_id,
            amount: amount,
            open_price: price,
            type: "market",
            method: "sell",
            target_price: req.body.target_price,
          });

          let saved = await orders.save();
          if (saved) {
            fromWalelt.amount = fromWalelt.amount - amount;
            toWalelt.amount = toWalelt.amount + total - parseFloat(fee);
            await fromWalelt.save();
            await toWalelt.save();

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

    await setFeeCredit(req.body.user_id, getPair._id, fee);
  } catch (err) {
    console.log(err);
    res.json({ status: "fail", message: "unknow_error" });
  }
};

module.exports = addOrders;
