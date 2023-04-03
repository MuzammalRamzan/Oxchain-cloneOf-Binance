const Pairs = require("../../models/Pairs");
const setFeeCredit = require('../bonus/setFeeCredit');
const axios = require("axios");
var authFile = require("../../auth.js");
const FutureWalletId = "62ff3c742bebf06a81be98fd";
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");
const ApiRequest = require("../../models/ApiRequests");
const ApiKeysModel = require("../../models/ApiKeys");

function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}


const LimitFutureOrder = async (req, res) => {

    if (req.body.api_key == undefined || req.body.api_key == "" || req.body.api_key == null) {
        res.json({ status: "fail", message: "Forbidden 403" });
        return;
    }

    let key = req.headers["key"];

    if (!key) {
        return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
        return res.json({ status: "fail", message: "invalid_params" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
        return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
        return res.json({ status: "fail", message: "invalid_key" });
    }

    if (req.body.order_id == undefined || req.body.order_id == "" || req.body.order_id == null) {
        res.json({ status: "fail", message: "Please enter future type" });
        return;
    }

    if (req.body.user_id == undefined || req.body.user_id == "" || req.body.user_id == null) {
        res.json({ status: "fail", message: "Please enter user id" });
        return;
    }
    if (req.body.limit == undefined || req.body.limit == "" || req.body.limit == null) {
        res.json({ status: "fail", message: "Please enter limit price" });
        return;
    }


    var api_key_result = req.body.api_key;
    let apiResult = await authFile.apiKeyChecker(api_key_result);
    let apiRequest = "";
    if (apiResult === false) {
        let checkApiKeys = "";

        checkApiKeys = await ApiKeysModel.findOne({
            api_key: api_key_result,
            futures: "1"
        }).exec();

        if (checkApiKeys != null) {

            apiRequest = new ApiRequest({
                api_key: api_key_result,
                request: "addFutureOrder",
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

    let getRelevantOrder = await FutureOrder.findOne({ _id: req.body.order_id, user_id: req.body.user_id });
    if (getRelevantOrder == null) {
        return res.json({ status: "fail", message: "Order not found" });
    }

    let future_type = getRelevantOrder.future_type;
    let user_id = req.body.user_id;
    let percent = req.body.percent;

    let type = getRelevantOrder.type == 'buy' ? 'sell' : 'buy';
    let method = 'limit';
    let target_price = parseFloat(req.body.limit) ?? 0.0;
    let leverage = getRelevantOrder.leverage;
    let symbol = getRelevantOrder.pair_name;

    if (percent <= 0 || percent > 100) {
        res.json({ status: "fail", message: "Invalid amount" });
        return;
    }



    let getSameOrder = await FutureOrder.find({ pair_name: symbol, future_type: (future_type == 'cross' ? 'isolated' : 'cross'), user_id: user_id, $lt: 0 });
    for (var h = 0; h < getSameOrder.length; h++) {
        let val = getSameOrder[h];
        if (val.method == 'market') {
            if (val.status == 0) {
                res.json({ status: "fail", message: "You currently have a transaction for this symbol" });
                return;
            }
        }

        if (val.method == 'limit' || val.method == 'stop_limit') {
            if (val.status == 1) {
                res.json({ status: "fail", message: "You currently have a transaction for this symbol" });
                return;
            }
        }
    }



    let getPair = await Pairs.findOne({ name: symbol }).exec();
    if (getPair == null) {
        res.json({ status: "fail", message: "invalid_pair" });
        return;
    }


    let userBalance = await FutureWalletModel.findOne({
        user_id: req.body.user_id,
    }).exec();

    if (userBalance.amount <= 0) {
        res.json({ status: "fail", message: "Invalid balance" });
        return;
    }
    var urlPair = getPair.name.replace("/", "");

    let url =
        'http://global.oxhain.com:8542/price?symbol=' + urlPair;
    result = await axios(url);
    var price = parseFloat(result.data.data.ask);
    if (future_type == "isolated") {
        if (method == "limit") {
            if (req.body.target_price == undefined || req.body.target_price == "" || req.body.target_price == null) {
                res.json({ status: "fail", message: "Please enter target price" });
                return;
            }

            target_price = parseFloat(target_price);

            if (target_price <= 0) {
                res.json({ status: "fail", message: "Please enter a greather zero" });
                return;
            }

            amount =
                (((getRelevantOrder.amount * getRelevantOrder.open_price) * percent) / 100 / target_price) *
                getRelevantOrder.leverage;
            amount = splitLengthNumber(amount);
            let usedUSDT = (amount * target_price) / getRelevantOrder.leverage;

            userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
            await userBalance.save();

            let order = new FutureOrder({
                pair_id: getPair._id,
                pair_name: getPair.name,
                type: type,
                future_type: future_type,
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

            if (apiResult === false) {
                apiRequest.status = 1;
                await apiRequest.save();
            }
            res.json({ status: "success", data: order });
            return;
        }
    } else if (future_type == "cross") {

        target_price = parseFloat(target_price);

        if (target_price <= 0) {
            return res.json({ status: "fail", message: "Please enter a greather zero" });
        }

        if (getRelevantOrder.type == 'buy') {
            if (target_price < price) {
                if (percent == 100) {
                    getRelevantOrder.status = 1;
                    await getRelevantOrder.save();
                    let marginWallet = await FutureWalletModel.findOne({
                        user_id: user_id,
                    }).exec();

                    marginWallet.pnl = marginWallet.pnl - getRelevantOrder.pnl;
                    marginWallet.amount = marginWallet.amount + getRelevantOrder.pnl + getRelevantOrder.usedUSDT;
                    await marginWallet.save();

                    res.json({ status: "success", message: "OK" });
                    return;
                } else {
                    let amount = (((getRelevantOrder.amount) * percent) / 100);
                    let usedUSDT = (amount * target_price) / getRelevantOrder.leverage;
                    //Miktarda sell oluştur
                    let order = new FutureOrder({
                        pair_id: getPair._id,
                        pair_name: getPair.name,
                        type: "sell",
                        future_type: getRelevantOrder.future_type,
                        method: "limit",
                        user_id: getRelevantOrder.user_id,
                        usedUSDT: usedUSDT,
                        required_margin: usedUSDT,
                        isolated: getRelevantOrder.usedUSDT,
                        sl: getRelevantOrder.sl ?? 0,
                        tp: getRelevantOrder.tp ?? 0,
                        target_price: target_price,
                        leverage: getRelevantOrder.leverage,
                        amount: amount,
                        open_price: target_price,
                        status: 0,
                        relevant_order_id: getRelevantOrder._id
                    });
                    await order.save();
                    //Pozisyonu azalt
                    getRelevantOrder.amount = splitLengthNumber(getRelevantOrder.amount - amount);
                    getRelevantOrder.usedUSDT = getRelevantOrder.usedUSDT - usedUSDT;
                    await getRelevantOrder.save();

                    let marginWallet = await FutureWalletModel.findOne({
                        user_id: user_id,
                    }).exec();

                    marginWallet.pnl = splitLengthNumber(marginWallet.pnl - getRelevantOrder.pnl);
                    marginWallet.amount = splitLengthNumber(marginWallet.amount + order.pnl + order.usedUSDT);
                    await marginWallet.save();
                    return res.json({ status: "success", message: order });
                }

            } else {

                //Limit oluştur
                amount = (((getRelevantOrder.amount)) * percent / 100);
                let usedUSDT = (amount * target_price) / getRelevantOrder.leverage;
                let order = new FutureOrder({
                    pair_id: getPair._id,
                    pair_name: getPair.name,
                    type: type,
                    future_type: future_type,
                    method: "limit",
                    user_id: user_id,
                    usedUSDT: usedUSDT,
                    required_margin: usedUSDT,
                    isolated: 0.0,
                    sl: req.body.sl ?? 0,
                    tp: req.body.tp ?? 0,
                    target_price: target_price,
                    leverage: leverage,
                    relevant_order_id: getRelevantOrder._id,
                    amount: amount,
                    open_price: target_price,
                    status: 1,
                });
                await order.save();

                if (apiResult === false) {
                    apiRequest.status = 1;
                    await apiRequest.save();
                }
                return res.json({ status: "success", data: order });
            }
        }




        else {
            if (target_price > price) {
                if (percent == 100) {
                    getRelevantOrder.status = 1;
                    await getRelevantOrder.save();
                    let marginWallet = await FutureWalletModel.findOne({
                        user_id: user_id,
                    }).exec();

                    marginWallet.pnl = marginWallet.pnl - getRelevantOrder.pnl;
                    marginWallet.amount = marginWallet.amount + getRelevantOrder.pnl + getRelevantOrder.usedUSDT;
                    await marginWallet.save();

                    res.json({ status: "success", message: "OK" });
                    return;
                } else {
                    let amount = (((getRelevantOrder.amount) * percent) / 100);
                    let usedUSDT = (amount * target_price) / getRelevantOrder.leverage;
                    //Miktarda sell oluştur
                    let order = new FutureOrder({
                        pair_id: getPair._id,
                        pair_name: getPair.name,
                        type: "buy",
                        future_type: getRelevantOrder.future_type,
                        method: "limit",
                        user_id: getRelevantOrder.user_id,
                        usedUSDT: usedUSDT,
                        required_margin: usedUSDT,
                        isolated: getRelevantOrder.usedUSDT,
                        sl: getRelevantOrder.sl ?? 0,
                        tp: getRelevantOrder.tp ?? 0,
                        target_price: target_price,
                        leverage: getRelevantOrder.leverage,
                        amount: amount,
                        open_price: target_price,
                        status: 0,
                        relevant_order_id: getRelevantOrder._id
                    });
                    await order.save();
                    //Pozisyonu azalt
                    getRelevantOrder.amount = splitLengthNumber(getRelevantOrder.amount - amount);
                    getRelevantOrder.usedUSDT = getRelevantOrder.usedUSDT - usedUSDT;
                    await getRelevantOrder.save();

                    let marginWallet = await FutureWalletModel.findOne({
                        user_id: user_id,
                    }).exec();

                    marginWallet.pnl = splitLengthNumber(marginWallet.pnl - getRelevantOrder.pnl);
                    marginWallet.amount = splitLengthNumber(marginWallet.amount + order.pnl + order.usedUSDT);
                    await marginWallet.save();
                    return res.json({ status: "success", message: order });
                }

            } else {

                //Limit oluştur
                amount = (((getRelevantOrder.amount)) * percent / 100);
                let usedUSDT = (amount * target_price) / getRelevantOrder.leverage;
                let order = new FutureOrder({
                    pair_id: getPair._id,
                    pair_name: getPair.name,
                    type: type,
                    future_type: future_type,
                    method: "limit",
                    user_id: user_id,
                    usedUSDT: usedUSDT,
                    required_margin: usedUSDT,
                    isolated: 0.0,
                    sl: req.body.sl ?? 0,
                    tp: req.body.tp ?? 0,
                    target_price: target_price,
                    leverage: leverage,
                    relevant_order_id: getRelevantOrder._id,
                    amount: amount,
                    open_price: target_price,
                    status: 1,
                });
                await order.save();

                if (apiResult === false) {
                    apiRequest.status = 1;
                    await apiRequest.save();
                }
                return res.json({ status: "success", data: order });
            }
        }



    }

}
module.exports = LimitFutureOrder;