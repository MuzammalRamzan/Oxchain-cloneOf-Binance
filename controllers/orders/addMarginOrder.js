const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
const axios = require("axios");
var authFile = require("../../auth.js");
const MarginOrder = require("../../models/MarginOrder");
const setFeeCredit = require('../bonus/setFeeCredit');
const addMarginOrder = async (req, res) => {
  
  try {
    var api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result !== true) {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }

    const MarginWalletId = "62ff3c742bebf06a81be98fd";
    let margin_type = req.body.margin_type;
    let user_id = req.body.user_id;
    let symbol = req.body.symbol;
    let percent = req.body.percent;
    let amount = parseFloat(req.body.amount) ?? 0.0;
    let type = req.body.type;
    let method = req.body.method;
    let target_price = parseFloat(req.body.target_price) ?? 0.0;
    let stop_limit = parseFloat(req.body.stop_limit) ?? 0.0;
    let leverage = 3;
    if (amount <= 0 || percent <= 0) {
      res.json({ status: "fail", message: "invalid_amount" });
      return;
    }
    let userBalance = await Wallet.findOne({
      coin_id: MarginWalletId,
      user_id: req.body.user_id,
    }).exec();

    let getPair = await Pairs.findOne({ name: req.body.symbol }).exec();
    if (getPair == null) {
      res.json({ status: "fail", message: "invalid_pair" });
      return;
    }

    var urlPair = getPair.name.replace("/", "");
    let url =
      'http://global.oxhain.com:8542/price?symbol=' + urlPair;
    result = await axios(url);
    var price = parseFloat(result.data.data.ask);
    if (margin_type == "isolated") {
      if (method == "limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({ status: "fail", message: "Please enter a greather zero" });
          return;
        }

        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        const fee = (amount * getPair.tradeFee) / 100;
        await setFeeCredit(user_id, getPair._id, fee);
        
        res.json({ status: "success", data: order });
        return;
      } else if (method == "stop_limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({
            status: "fail",
            message: "Limit price must be greater than 0.",
          });
          return;
        }

        if (stop_limit <= 0) {
          res.json({
            status: "fail",
            message: "Stop limit must be greater than 0.",
          });
          return;
        }

        if (type == "buy") {
          if (stop_limit < target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be greater then target price",
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
        }

        if (type == "sell") {
          if (stop_limit > target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be smaller then target price",
            });
            return;
          }
          if (target_price <= price) {
            res.json({
              status: "fail",
              message: "Price can't be smaller than stop price",
            });
            return;
          }
        }

        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          stop_limit: stop_limit,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        const fee = (amount * getPair.tradeFee) / 100;
        await setFeeCredit(user_id, getPair._id, fee);
        res.json({ status: "success", data: order });
        return;
      } else if (req.body.method == "market") {
        amount =
          ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
        let usedUSDT = (amount * price) / req.body.leverage;

        let reverseOreders = await MarginOrder.findOne({
          user_id: req.body.user_id,
          pair_id: getPair._id,
          margin_type: margin_type,
          method: "market",
          status: 0,
        });

        if (reverseOreders) {
          if (reverseOreders.leverage > leverage) {
            res.json({ status: "fail", message: "Leverage cannot be smaller" });
            return;
          }
          if (reverseOreders.type == type) {
            let oldAmount = reverseOreders.amount;
            let oldUsedUSDT = reverseOreders.usedUSDT;
            let oldPNL = reverseOreders.pnl;
            let oldLeverage = reverseOreders.leverage;
            let newUsedUSDT = oldUsedUSDT + usedUSDT + oldPNL;
            reverseOreders.usedUSDT = newUsedUSDT;
            reverseOreders.open_price = price;
            reverseOreders.pnl = 0;
            reverseOreders.leverage = leverage;
            reverseOreders.open_time = Date.now();
            reverseOreders.amount = (newUsedUSDT * leverage) / price;

            userBalance = await Wallet.findOne({
              coin_id: MarginWalletId,
              user_id: req.body.user_id,
            }).exec();
            userBalance.amount = userBalance.amount - usedUSDT;
            await userBalance.save();

            await reverseOreders.save();
            res.json({ status: "success", data: reverseOreders });
            return;
          } else {
            //Tersine ise
            let checkusdt =
              (reverseOreders.usedUSDT + reverseOreders.pnl) *
              reverseOreders.leverage;
            if (checkusdt == usedUSDT * leverage) {
              reverseOreders.status = 1;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount =
                userBalance.amount +
                reverseOreders.pnl +
                reverseOreders.usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            }

            if (checkusdt > usedUSDT * leverage) {
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              reverseOreders.amount =
                (writeUsedUSDT * reverseOreders.leverage) / price;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            } else {
              /*
                20 lik işlem var
                50 luk ters işlem açıyor
                toplam da 10 luk pozisyon olacak


              */

              let ilkIslem = reverseOreders.usedUSDT;
              let tersIslem = usedUSDT;
              let data = ilkIslem - tersIslem;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + data;
              await userBalance.save();

              reverseOreders.type = type;
              reverseOreders.leverage = leverage;
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
              reverseOreders.amount = (writeUsedUSDT * leverage) / price;
              await reverseOreders.save();

              res.json({ status: "success", data: reverseOreders });
              return;
            }
          }
        } else {
          userBalance = await Wallet.findOne({
            coin_id: MarginWalletId,
            user_id: req.body.user_id,
          }).exec();
          userBalance.amount = userBalance.amount - usedUSDT;
          await userBalance.save();
          let order = new MarginOrder({
            pair_id: getPair._id,
            pair_name: getPair.name,
            type: type,
            margin_type: margin_type,
            method: method,
            user_id: user_id,
            usedUSDT: usedUSDT,
            required_margin: usedUSDT,
            isolated: usedUSDT,
            sl: req.body.sl ?? 0,
            tp: req.body.tp ?? 0,
            target_price: 0.0,
            leverage: leverage,
            amount: amount,
            open_price: price,
          });
          await order.save();
          const fee = (amount * getPair.tradeFee) / 100;
        await setFeeCredit(user_id, getPair._id, fee);
          res.json({ status: "success", data: order });
          return;
        }
      }
    } else if (margin_type == "cross") {
      if (method == "limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({ status: "fail", message: "Please enter a greather zero" });
          return;
        }

        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        const fee = (amount * getPair.tradeFee) / 100;
        await setFeeCredit(user_id, getPair._id, fee);
        res.json({ status: "success", data: order });
        return;
      } else if (method == "stop_limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
          res.json({
            status: "fail",
            message: "Limit price must be greater than 0.",
          });
          return;
        }

        if (stop_limit <= 0) {
          res.json({
            status: "fail",
            message: "Stop limit must be greater than 0.",
          });
          return;
        }

        if (type == "buy") {
          if (stop_limit < target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be greater then target price",
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
        }

        if (type == "sell") {
          if (stop_limit > target_price) {
            res.json({
              status: "fail",
              message: "Stop limit price can't be smaller then target price",
            });
            return;
          }
          if (target_price <= price) {
            res.json({
              status: "fail",
              message: "Price can't be smaller than stop price",
            });
            return;
          }
        }


        amount =
          ((userBalance.amount * percent) / 100 / target_price) *
          req.body.leverage;
        let usedUSDT = (amount * target_price) / req.body.leverage;

        userBalance.amount = userBalance.amount - usedUSDT;
        await userBalance.save();
        let order = new MarginOrder({
          pair_id: getPair._id,
          pair_name: getPair.name,
          type: type,
          margin_type: margin_type,
          method: method,
          user_id: user_id,
          usedUSDT: usedUSDT,
          required_margin: usedUSDT,
          isolated: 0.0,
          sl: req.body.sl ?? 0,
          tp: req.body.tp ?? 0,
          target_price: target_price,
          stop_limit: stop_limit,
          leverage: leverage,
          amount: amount,
          open_price: target_price,
          status: 1,
        });
        await order.save();
        const fee = (amount * getPair.tradeFee) / 100;
        await setFeeCredit(user_id, getPair._id, fee);
        res.json({ status: "success", data: order });
        return;
      } else if (req.body.method == "market") {
        amount =
          ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
        let usedUSDT = (amount * price) / req.body.leverage;

        let reverseOreders = await MarginOrder.findOne({
          user_id: req.body.user_id,
          pair_id: getPair._id,
          margin_type: margin_type,
          method: "market",
          status: 0,
        }).exec();

        if (reverseOreders) {
          if (reverseOreders.leverage > leverage) {
            res.json({ status: "fail", message: "Leverage cannot be smaller" });
            return;
          }
          if (reverseOreders.type == type) {
            let oldAmount = reverseOreders.amount;
            let oldUsedUSDT = reverseOreders.usedUSDT;
            let oldPNL = reverseOreders.pnl;
            let oldLeverage = reverseOreders.leverage;
            let newUsedUSDT = oldUsedUSDT + usedUSDT + oldPNL;
            reverseOreders.usedUSDT = newUsedUSDT;
            reverseOreders.open_price = price;
            reverseOreders.pnl = 0;
            reverseOreders.leverage = leverage;
            reverseOreders.open_time = Date.now();
            reverseOreders.amount = (newUsedUSDT * leverage) / price;

            userBalance = await Wallet.findOne({
              coin_id: MarginWalletId,
              user_id: req.body.user_id,
            }).exec();
            userBalance.amount = userBalance.amount - usedUSDT;
            await userBalance.save();

            await reverseOreders.save();
            res.json({ status: "success", data: reverseOreders });
            return;
          } else {
            //Tersine ise
            let checkusdt =
              (reverseOreders.usedUSDT + reverseOreders.pnl) *
              reverseOreders.leverage;
            if (checkusdt == usedUSDT * leverage) {
              reverseOreders.status = 1;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount =
                userBalance.amount +
                reverseOreders.pnl +
                reverseOreders.usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            }

            if (checkusdt > usedUSDT * leverage) {
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              reverseOreders.amount =
                (writeUsedUSDT * reverseOreders.leverage) / price;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + usedUSDT;
              await userBalance.save();
              await reverseOreders.save();
              res.json({ status: "success", data: reverseOreders });
              return;
            } else {
              /*
                20 lik işlem var
                50 luk ters işlem açıyor
                toplam da 10 luk pozisyon olacak


              */

              let ilkIslem = reverseOreders.usedUSDT;
              let tersIslem = usedUSDT;
              let data = ilkIslem - tersIslem;
              userBalance = await Wallet.findOne({
                coin_id: MarginWalletId,
                user_id: req.body.user_id,
              }).exec();
              userBalance.amount = userBalance.amount + data;
              await userBalance.save();

              reverseOreders.type = type;
              reverseOreders.leverage = leverage;
              let writeUsedUSDT =
                reverseOreders.usedUSDT + reverseOreders.pnl - usedUSDT;
              if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
              reverseOreders.usedUSDT = writeUsedUSDT;
              //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
              reverseOreders.amount = (writeUsedUSDT * leverage) / price;
              await reverseOreders.save();

              res.json({ status: "success", data: reverseOreders });
              return;
            }
          }
        } else {
          userBalance = await Wallet.findOne({
            coin_id: MarginWalletId,
            user_id: req.body.user_id,
          }).exec();
          userBalance.amount = userBalance.amount - usedUSDT;
          await userBalance.save();
          let order = new MarginOrder({
            pair_id: getPair._id,
            pair_name: getPair.name,
            type: type,
            margin_type: margin_type,
            method: method,
            user_id: user_id,
            usedUSDT: usedUSDT,
            required_margin: usedUSDT,
            isolated: usedUSDT,
            sl: req.body.sl ?? 0,
            tp: req.body.tp ?? 0,
            target_price: 0.0,
            leverage: leverage,
            amount: amount,
            open_price: price,
          });
          await order.save();
          const fee = (amount * getPair.tradeFee) / 100;
        await setFeeCredit(req.body.user_id, getPair._id, fee);
          res.json({ status: "success", data: order });
          return;
        }
      }
    }
  } catch (err) {
    throw err;
  }
};

module.exports = addMarginOrder;
