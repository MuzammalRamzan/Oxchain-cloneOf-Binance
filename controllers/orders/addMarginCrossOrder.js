const MarginCrossWallet = require("../../models/MarginCrossWallet");
const MarginOrder = require("../../models/MarginOrder");
const Pairs = require("../../models/Pairs");
const setFeeCredit = require('../bonus/setFeeCredit');
const axios = require("axios");
var authFile = require("../../auth.js");
const addMarginCrossOrder = async (req, res) => {
    var api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result !== true) {
        res.json({ status: "fail", message: "Forbidden 403" });
        return;
    }
    let margin_type = "cross";
    let user_id = req.body.user_id;
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

    let getPair = await Pairs.findOne({ name: req.body.symbol }).exec();
    if (getPair == null) {
        res.json({ status: "fail", message: "invalid_pair" });
        return;
    }
    let fromWallet = await MarginCrossWallet.findOne({
        coin_id: getPair.symbolOneID,
        user_id: user_id,
    }).exec();
    let toWallet = await MarginCrossWallet.findOne({
        coin_id: getPair.symbolTwoID,
        user_id: user_id,
    }).exec();

    var urlPair = getPair.name.replace("/", "");
    let url =
        'http://global.oxhain.com:8542/price?symbol=' + urlPair;
    result = await axios(url);
    var price = parseFloat(result.data.data.ask);
    
    if (method == "limit") {
        target_price = parseFloat(target_price);

        if (target_price <= 0) {
            res.json({ status: "fail", message: "Please enter a greather zero" });
            return;
        }
        let amount = 0;

        if (type == 'buy') {
            amount = (toWallet.amount * percent) / 100 / parseFloat(target_price) * parseFloat(leverage);
            if (toWallet.amount < amount) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            toWallet.amount = parseFloat(toWallet.amount) - amount;
            await toWallet.save();
        } else if (type == 'sell') {
            amount = parseFloat(req.body.amount);
            if (fromWallet.amount < amount) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            fromWallet.amount = parseFloat(fromWallet.amount) - amount;
            await fromWallet.save();
        }

        let order = new MarginOrder({
            pair_id: getPair._id,
            pair_name: getPair.name,
            type: type,
            margin_type: margin_type,
            method: method,
            user_id: user_id,
            usedUSDT: 0.0,
            required_margin: 0.0,
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

        if (type == 'buy') {
            amount = (toWallet.amount * percent) / 100 / parseFloat(target_price) * parseFloat(leverage);
            if (toWallet.amount < amount) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            toWallet.amount = parseFloat(toWallet.amount) - amount;
            await toWallet.save();
        } else if (type == 'sell') {
            amount = parseFloat(req.body.amount);
            if (fromWallet.amount < amount) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            fromWallet.amount = parseFloat(fromWallet.amount) - amount;
            await fromWallet.save();
        }


        let order = new MarginOrder({
            pair_id: getPair._id,
            pair_name: getPair.name,
            type: type,
            margin_type: margin_type,
            method: method,
            user_id: user_id,
            usedUSDT: 0.0,
            required_margin: 0.0,
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
        if (type == 'buy') {
            
            if(toWallet.amount <= 0) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            amount = (toWallet.amount * percent) / 100 / parseFloat(price) * parseFloat(leverage);
            if (toWallet.amount < amount) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            fromWallet.amount = parseFloat(fromWallet.amount) + amount;
            await fromWallet.save();
            toWallet.amount = parseFloat(toWallet.amount) - (amount * price);
            await toWallet.save();
        } else if (type == 'sell') {
            if(fromWallet.amount <= 0) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            amount = (fromWallet.amount * percent) / 100.0;
            if (fromWallet.amount < amount) {
                res.json({ status: "fail", message: "Invalid balance" });
                return;
            }
            fromWallet.amount = parseFloat(fromWallet.amount) - amount;
            await fromWallet.save();
            toWallet.amount = parseFloat(toWallet.amount) + (amount * price);
            await toWallet.save();
        }

        let order = new MarginOrder({
            pair_id: getPair._id,
            pair_name: getPair.name,
            type: type,
            margin_type: margin_type,
            method: method,
            user_id: user_id,
            usedUSDT: 0.0,
            required_margin: 0.0,
            isolated: 0.0,
            sl: req.body.sl ?? 0,
            tp: req.body.tp ?? 0,
            target_price: 0.0,
            stop_limit: 0.0,
            leverage: leverage,
            amount: amount,
            open_price: price,
            status: 1,
        });
        await order.save();
        const fee = (amount * getPair.tradeFee) / 100;
        await setFeeCredit(user_id, getPair._id, fee);
        res.json({ status: "success", data: order });
        return;

    }
}
module.exports = addMarginCrossOrder;