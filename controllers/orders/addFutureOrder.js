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


const addFutureOrder = async (req, res) => {

    if (req.body.api_key == undefined || req.body.api_key == "" || req.body.api_key == null) {
        return res.json({ status: "fail", message: "Forbidden 403" });
        return;
    }

    if (req.body.future_type == undefined || req.body.future_type == "" || req.body.future_type == null) {
        return res.json({ status: "fail", message: "Please enter future type" });
        return;
    }

    if (req.body.user_id == undefined || req.body.user_id == "" || req.body.user_id == null) {
        return res.json({ status: "fail", message: "Please enter user id" });
        return;
    }

    if (req.body.type == undefined || req.body.type == "" || req.body.type == null) {
        return res.json({ status: "fail", message: "Please enter type" });
        return;
    }

    if (req.body.method == undefined || req.body.method == "" || req.body.method == null) {
        return res.json({ status: "fail", message: "Please enter method" });
        return;
    }

    if (req.body.leverage == undefined || req.body.leverage == "" || req.body.leverage == null) {
        return res.json({ status: "fail", message: "Please enter leverage" });
        return;
    }

    var api_key_result = req.body.api_key;
    let apiResult = await authFile.apiKeyChecker(api_key_result);
    let apiRequest = "";
    if (apiResult === false) {

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
            return res.json({ status: "fail", message: "Forbidden 403" });
            return;
        }
    }
    let future_type = req.body.future_type;
    let user_id = req.body.user_id;
    let percent = req.body.percent;
    let amount = parseFloat(req.body.amount) ?? 0.0;
    let type = req.body.type;
    let method = req.body.method;
    let target_price = parseFloat(req.body.target_price) ?? 0.0;
    let stop_limit = parseFloat(req.body.stop_limit) ?? 0.0;
    let leverage = req.body.leverage;
    let symbol = req.body.symbol;

    if (amount <= 0 || percent <= 0) {
        return res.json({ status: "fail", message: "Invalid amount" });
        return;
    }



    let getSameOrder = await FutureOrder.find({ pair_name: symbol, future_type: (future_type == 'cross' ? 'isolated' : 'cross'), user_id: user_id, $lt: 0 });
    for (var h = 0; h < getSameOrder.length; h++) {
        let val = getSameOrder[h];
        if (val.method == 'market') {
            if (val.status == 0) {
                return res.json({ status: "fail", message: "You currently have a transaction for this symbol" });
                return;
            }
        }

        if (val.method == 'limit' || val.method == 'stop_limit') {
            if (val.status == 1) {
                return res.json({ status: "fail", message: "You currently have a transaction for this symbol" });
                return;
            }
        }
    }



    let getPair = await Pairs.findOne({ name: symbol }).exec();
    if (getPair == null) {
        return res.json({ status: "fail", message: "invalid_pair" });
        return;
    }


    let userBalance = await FutureWalletModel.findOne({
        user_id: req.body.user_id,
    }).exec();

    if (userBalance.amount <= 0) {
        return res.json({ status: "fail", message: "Invalid balance" });
        return;
    }
    var urlPair = getPair.name.replace("/", "");

    let url =
        'http://global.oxhain.com:8542/future_price?symbol=' + urlPair;
    result = await axios(url);
    var price = parseFloat(result.data.data.ask);
    if (future_type == "isolated") {
        if (method == "limit") {
            if (req.body.target_price == undefined || req.body.target_price == "" || req.body.target_price == null) {
                return res.json({ status: "fail", message: "Please enter target price" });
                return;
            }

            target_price = parseFloat(target_price);

            if (target_price <= 0) {
                return res.json({ status: "fail", message: "Please enter a greather zero" });
                return;
            }

            amount =
                ((userBalance.amount * percent) / 100 / target_price) *
                req.body.leverage;
            amount = splitLengthNumber(amount);
            let usedUSDT = (amount * target_price) / req.body.leverage;

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
            return res.json({ status: "success", data: order });
            return;
        } else if (method == "stop_limit") {

            if (req.body.target_price == undefined || req.body.target_price == "" || req.body.target_price == null) {
                return res.json({ status: "fail", message: "Please enter target price" });
                return;
            }

            if (req.body.stop_limit == undefined || req.body.stop_limit == "" || req.body.stop_limit == null) {
                return res.json({ status: "fail", message: "Please enter stop limit" });
                return;
            }


            target_price = parseFloat(target_price);

            if (target_price <= 0) {
                return res.json({
                    status: "fail",
                    message: "Limit price must be greater than 0.",
                });
                return;
            }

            if (stop_limit <= 0) {
                return res.json({
                    status: "fail",
                    message: "Stop limit must be greater than 0.",
                });
                return;
            }

            if (type == "buy") {
                if (stop_limit < target_price) {
                    return res.json({
                        status: "fail",
                        message: "Stop limit price can't be greater then target price",
                    });
                    return;
                }

                if (target_price >= price) {
                    return res.json({
                        status: "fail",
                        message: "Buy limit order must be below the price",
                    });
                    return;
                }
            }

            if (type == "sell") {
                if (stop_limit > target_price) {
                    return res.json({
                        status: "fail",
                        message: "Stop limit price can't be smaller then target price",
                    });
                    return;
                }
                if (target_price <= price) {
                    return res.json({
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
                stop_limit: stop_limit,
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
            return res.json({ status: "success", data: order });
            return;
        } else if (req.body.method == "market") {
            amount =
                ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
            let usedUSDT = (amount * price) / req.body.leverage;
            const fee = usedUSDT * (type == 'buy' ? 0.03 : 0.06) / 100.0;
            let totalUsedUSDT = usedUSDT - fee;
            let reverseOreders = await FutureOrder.findOne({
                user_id: req.body.user_id,
                pair_id: getPair._id,
                future_type: future_type,
                method: "market",
                status: 0,
            });

            if (reverseOreders) {
                if (reverseOreders.leverage > leverage) {
                    return res.json({ status: "fail", message: "Leverage cannot be smaller" });
                    return;
                }
                if (reverseOreders.type == type) {
                    let oldAmount = reverseOreders.amount;
                    let oldUsedUSDT = reverseOreders.usedUSDT;
                    let oldPNL = reverseOreders.pnl;
                    let oldLeverage = reverseOreders.leverage;
                    let newUsedUSDT = oldUsedUSDT + totalUsedUSDT + oldPNL;
                    reverseOreders.usedUSDT = newUsedUSDT;
                    reverseOreders.open_price = price;
                    reverseOreders.fee += fee;
                    reverseOreders.pnl = 0;
                    reverseOreders.leverage = leverage;
                    reverseOreders.open_time = Date.now();
                    reverseOreders.amount = splitLengthNumber((newUsedUSDT * leverage) / price);

                    userBalance = await FutureWalletModel.findOne({

                        user_id: req.body.user_id,
                    }).exec();
                    userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                    await userBalance.save();

                    await reverseOreders.save();
                    if (apiResult === false) {
                        apiRequest.status = 1;
                        await apiRequest.save();
                    }
                    await setFeeCredit(user_id, getPair._id, fee);
                    return res.json({ status: "success", data: reverseOreders });
                    return;
                } else {
                    //Tersine ise
                    let checkusdt =
                        (reverseOreders.usedUSDT + reverseOreders.pnl) *
                        reverseOreders.leverage;
                    if (checkusdt == totalUsedUSDT * leverage) {
                        reverseOreders.status = 1;
                        userBalance = await FutureWalletModel.findOne({

                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount =
                            userBalance.amount +
                            reverseOreders.pnl +
                            reverseOreders.usedUSDT;
                        await userBalance.save();
                        reverseOreders.fee += fee;
                        await reverseOreders.save();
                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        await setFeeCredit(user_id, getPair._id, fee);
                        return res.json({ status: "success", data: reverseOreders });
                        return;
                    }

                    if (checkusdt > usedUSDT * leverage) {
                        let writeUsedUSDT =
                            reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                        if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                        reverseOreders.usedUSDT = writeUsedUSDT;
                        reverseOreders.amount =
                            (writeUsedUSDT * reverseOreders.leverage) / price;
                        userBalance = await FutureWalletModel.findOne({

                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount = splitLengthNumber(userBalance.amount + usedUSDT);
                        await userBalance.save();
                        await reverseOreders.save();
                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        await setFeeCredit(user_id, getPair._id, fee);
                        return res.json({ status: "success", data: reverseOreders });
                        return;
                    } else {
                        /*
                          20 lik işlem var
                          50 luk ters işlem açıyor
                          toplam da 10 luk pozisyon olacak
          
          
                        */

                        let ilkIslem = reverseOreders.usedUSDT;
                        let tersIslem = totalUsedUSDT;
                        let data = tersIslem - ilkIslem;
                        if (data < 0)
                            data *= -1;
                        userBalance = await FutureWalletModel.findOne({

                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount = splitLengthNumber(userBalance.amount + (ilkIslem - data));
                        await userBalance.save();
                        reverseOreders.fee += fee;
                        reverseOreders.type = type;
                        reverseOreders.leverage = leverage;
                        let writeUsedUSDT =
                            reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                        if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                        reverseOreders.usedUSDT = writeUsedUSDT;
                        //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
                        reverseOreders.amount = splitLengthNumber((writeUsedUSDT * leverage) / price);
                        await reverseOreders.save();

                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        await setFeeCredit(user_id, getPair._id, fee);
                        return res.json({ status: "success", data: reverseOreders });
                        return;
                    }
                }
            } else {
                userBalance = await FutureWalletModel.findOne({
                    user_id: req.body.user_id,
                }).exec();
                userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                await userBalance.save();
                let order = new FutureOrder({
                    pair_id: getPair._id,
                    pair_name: getPair.name,
                    fee: fee,
                    type: type,
                    future_type: future_type,
                    method: method,
                    user_id: user_id,
                    usedUSDT: totalUsedUSDT,
                    required_margin: totalUsedUSDT,
                    isolated: totalUsedUSDT,
                    sl: req.body.sl ?? 0,
                    tp: req.body.tp ?? 0,
                    target_price: 0.0,
                    leverage: leverage,
                    amount: amount,
                    open_price: price,
                    status: 0
                });
                await order.save();

                await setFeeCredit(user_id, getPair._id, fee);
                if (apiResult === false) {
                    apiRequest.status = 1;
                    await apiRequest.save();
                }
                return res.json({ status: "success", data: order });
                return;
            }
        }
    } else if (future_type == "cross") {
        if (method == "limit") {
            target_price = parseFloat(target_price);

            if (target_price <= 0) {
                return res.json({ status: "fail", message: "Please enter a greather zero" });
                return;
            }

            if (type == 'buy') {
                if (target_price >= price) {


                    amount =
                        ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
                    let usedUSDT = (amount * price) / req.body.leverage;
                    const fee = usedUSDT * (type == 'buy' ? 0.03 : 0.06) / 100.0;
                    let totalUsedUSDT = usedUSDT - fee;
                    let reverseOreders = await FutureOrder.findOne({
                        user_id: req.body.user_id,
                        pair_id: getPair._id,
                        future_type: future_type,
                        method: "market",
                        status: 0,
                    });

                    if (reverseOreders) {
                        if (reverseOreders.leverage > leverage) {
                            return res.json({ status: "fail", message: "Leverage cannot be smaller" });
                            return;
                        }
                        if (reverseOreders.type == type) {
                            let oldAmount = reverseOreders.amount;
                            let oldUsedUSDT = reverseOreders.usedUSDT;
                            let oldPNL = reverseOreders.pnl;
                            let oldLeverage = reverseOreders.leverage;
                            let newUsedUSDT = oldUsedUSDT + totalUsedUSDT + oldPNL;
                            reverseOreders.usedUSDT = newUsedUSDT;
                            reverseOreders.open_price = price;
                            reverseOreders.fee += fee;
                            reverseOreders.pnl = 0;
                            reverseOreders.leverage = leverage;
                            reverseOreders.open_time = Date.now();
                            reverseOreders.amount = splitLengthNumber((newUsedUSDT * leverage) / price);

                            userBalance = await FutureWalletModel.findOne({

                                user_id: req.body.user_id,
                            }).exec();
                            userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                            await userBalance.save();

                            await reverseOreders.save();
                            if (apiResult === false) {
                                apiRequest.status = 1;
                                await apiRequest.save();
                            }
                            await setFeeCredit(user_id, getPair._id, fee);
                            return res.json({ status: "success", data: reverseOreders });
                            return;
                        } else {
                            //Tersine ise
                            let checkusdt =
                                (reverseOreders.usedUSDT + reverseOreders.pnl) *
                                reverseOreders.leverage;
                            if (checkusdt == totalUsedUSDT * leverage) {
                                reverseOreders.status = 1;
                                userBalance = await FutureWalletModel.findOne({

                                    user_id: req.body.user_id,
                                }).exec();
                                userBalance.amount =
                                    userBalance.amount +
                                    reverseOreders.pnl +
                                    reverseOreders.usedUSDT;
                                await userBalance.save();
                                reverseOreders.fee += fee;
                                await reverseOreders.save();
                                if (apiResult === false) {
                                    apiRequest.status = 1;
                                    await apiRequest.save();
                                }
                                await setFeeCredit(user_id, getPair._id, fee);
                                return res.json({ status: "success", data: reverseOreders });
                                return;
                            }

                            if (checkusdt > usedUSDT * leverage) {
                                let writeUsedUSDT =
                                    reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                                if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                                reverseOreders.usedUSDT = writeUsedUSDT;
                                reverseOreders.amount =
                                    (writeUsedUSDT * reverseOreders.leverage) / price;
                                userBalance = await FutureWalletModel.findOne({

                                    user_id: req.body.user_id,
                                }).exec();
                                userBalance.amount = splitLengthNumber(userBalance.amount + usedUSDT);
                                await userBalance.save();
                                await reverseOreders.save();
                                if (apiResult === false) {
                                    apiRequest.status = 1;
                                    await apiRequest.save();
                                }
                                await setFeeCredit(user_id, getPair._id, fee);
                                return res.json({ status: "success", data: reverseOreders });
                                return;
                            } else {
                                /*
                                  20 lik işlem var
                                  50 luk ters işlem açıyor
                                  toplam da 10 luk pozisyon olacak
                  
                  
                                */

                                let ilkIslem = reverseOreders.usedUSDT;
                                let tersIslem = totalUsedUSDT;
                                let data = tersIslem - ilkIslem;
                                if (data < 0)
                                    data *= -1;
                                userBalance = await FutureWalletModel.findOne({

                                    user_id: req.body.user_id,
                                }).exec();
                                userBalance.amount = splitLengthNumber(userBalance.amount + (ilkIslem - data));
                                await userBalance.save();
                                reverseOreders.fee += fee;
                                reverseOreders.type = type;
                                reverseOreders.leverage = leverage;
                                let writeUsedUSDT =
                                    reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                                if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                                reverseOreders.usedUSDT = writeUsedUSDT;
                                //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
                                reverseOreders.amount = splitLengthNumber((writeUsedUSDT * leverage) / price);
                                await reverseOreders.save();

                                if (apiResult === false) {
                                    apiRequest.status = 1;
                                    await apiRequest.save();
                                }
                                await setFeeCredit(user_id, getPair._id, fee);
                                return res.json({ status: "success", data: reverseOreders });
                                return;
                            }
                        }
                    } else {
                        userBalance = await FutureWalletModel.findOne({
                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                        await userBalance.save();
                        let order = new FutureOrder({
                            pair_id: getPair._id,
                            pair_name: getPair.name,
                            fee: fee,
                            type: type,
                            future_type: future_type,
                            method: "market",
                            user_id: user_id,
                            usedUSDT: totalUsedUSDT,
                            required_margin: totalUsedUSDT,
                            isolated: totalUsedUSDT,
                            sl: req.body.sl ?? 0,
                            tp: req.body.tp ?? 0,
                            target_price: 0.0,
                            leverage: leverage,
                            amount: amount,
                            open_price: price,
                            status: 0
                        });
                        await order.save();

                        await setFeeCredit(user_id, getPair._id, fee);
                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        return res.json({ status: "success", data: order });
                        return;
                    }


                }
            } else if (type == 'sell') {
                if (target_price <= price) {

                    amount =
                        ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
                    let usedUSDT = (amount * price) / req.body.leverage;
                    const fee = usedUSDT * (type == 'buy' ? 0.03 : 0.06) / 100.0;
                    let totalUsedUSDT = usedUSDT - fee;
                    let reverseOreders = await FutureOrder.findOne({
                        user_id: req.body.user_id,
                        pair_id: getPair._id,
                        future_type: future_type,
                        method: "market",
                        status: 0,
                    });

                    if (reverseOreders) {
                        if (reverseOreders.leverage > leverage) {
                            return res.json({ status: "fail", message: "Leverage cannot be smaller" });
                            return;
                        }
                        if (reverseOreders.type == type) {
                            let oldAmount = reverseOreders.amount;
                            let oldUsedUSDT = reverseOreders.usedUSDT;
                            let oldPNL = reverseOreders.pnl;
                            let oldLeverage = reverseOreders.leverage;
                            let newUsedUSDT = oldUsedUSDT + totalUsedUSDT + oldPNL;
                            reverseOreders.usedUSDT = newUsedUSDT;
                            reverseOreders.open_price = price;
                            reverseOreders.fee += fee;
                            reverseOreders.pnl = 0;
                            reverseOreders.leverage = leverage;
                            reverseOreders.open_time = Date.now();
                            reverseOreders.amount = splitLengthNumber((newUsedUSDT * leverage) / price);

                            userBalance = await FutureWalletModel.findOne({

                                user_id: req.body.user_id,
                            }).exec();
                            userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                            await userBalance.save();

                            await reverseOreders.save();
                            if (apiResult === false) {
                                apiRequest.status = 1;
                                await apiRequest.save();
                            }
                            await setFeeCredit(user_id, getPair._id, fee);
                            return res.json({ status: "success", data: reverseOreders });
                            return;
                        } else {
                            //Tersine ise
                            let checkusdt =
                                (reverseOreders.usedUSDT + reverseOreders.pnl) *
                                reverseOreders.leverage;
                            if (checkusdt == totalUsedUSDT * leverage) {
                                reverseOreders.status = 1;
                                userBalance = await FutureWalletModel.findOne({

                                    user_id: req.body.user_id,
                                }).exec();
                                userBalance.amount =
                                    userBalance.amount +
                                    reverseOreders.pnl +
                                    reverseOreders.usedUSDT;
                                await userBalance.save();
                                reverseOreders.fee += fee;
                                await reverseOreders.save();
                                if (apiResult === false) {
                                    apiRequest.status = 1;
                                    await apiRequest.save();
                                }
                                await setFeeCredit(user_id, getPair._id, fee);
                                return res.json({ status: "success", data: reverseOreders });
                                return;
                            }

                            if (checkusdt > usedUSDT * leverage) {
                                let writeUsedUSDT =
                                    reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                                if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                                reverseOreders.usedUSDT = writeUsedUSDT;
                                reverseOreders.amount =
                                    (writeUsedUSDT * reverseOreders.leverage) / price;
                                userBalance = await FutureWalletModel.findOne({

                                    user_id: req.body.user_id,
                                }).exec();
                                userBalance.amount = splitLengthNumber(userBalance.amount + usedUSDT);
                                await userBalance.save();
                                await reverseOreders.save();
                                if (apiResult === false) {
                                    apiRequest.status = 1;
                                    await apiRequest.save();
                                }
                                await setFeeCredit(user_id, getPair._id, fee);
                                return res.json({ status: "success", data: reverseOreders });
                                return;
                            } else {
                                /*
                                  20 lik işlem var
                                  50 luk ters işlem açıyor
                                  toplam da 10 luk pozisyon olacak
                  
                  
                                */

                                let ilkIslem = reverseOreders.usedUSDT;
                                let tersIslem = totalUsedUSDT;
                                let data = tersIslem - ilkIslem;
                                if (data < 0)
                                    data *= -1;
                                userBalance = await FutureWalletModel.findOne({

                                    user_id: req.body.user_id,
                                }).exec();
                                userBalance.amount = splitLengthNumber(userBalance.amount + (ilkIslem - data));
                                await userBalance.save();
                                reverseOreders.fee += fee;
                                reverseOreders.type = type;
                                reverseOreders.leverage = leverage;
                                let writeUsedUSDT =
                                    reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                                if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                                reverseOreders.usedUSDT = writeUsedUSDT;
                                //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
                                reverseOreders.amount = splitLengthNumber((writeUsedUSDT * leverage) / price);
                                await reverseOreders.save();

                                if (apiResult === false) {
                                    apiRequest.status = 1;
                                    await apiRequest.save();
                                }
                                await setFeeCredit(user_id, getPair._id, fee);
                                return res.json({ status: "success", data: reverseOreders });
                                return;
                            }
                        }
                    } else {
                        userBalance = await FutureWalletModel.findOne({
                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                        await userBalance.save();
                        let order = new FutureOrder({
                            pair_id: getPair._id,
                            pair_name: getPair.name,
                            fee: fee,
                            type: type,
                            future_type: future_type,
                            method: "market",
                            user_id: user_id,
                            usedUSDT: totalUsedUSDT,
                            required_margin: totalUsedUSDT,
                            isolated: totalUsedUSDT,
                            sl: req.body.sl ?? 0,
                            tp: req.body.tp ?? 0,
                            target_price: 0.0,
                            leverage: leverage,
                            amount: amount,
                            open_price: price,
                            status: 0
                        });
                        await order.save();

                        await setFeeCredit(user_id, getPair._id, fee);
                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        return res.json({ status: "success", data: order });
                        return;
                    }
                }
            }

            amount =
                ((userBalance.amount * percent) / 100 / target_price) *
                req.body.leverage;
            let usedUSDT = (amount * target_price) / req.body.leverage;

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
            return res.json({ status: "success", data: order });
            return;
        } else if (method == "stop_limit") {
            target_price = parseFloat(target_price);

            if (target_price <= 0) {
                return res.json({
                    status: "fail",
                    message: "Limit price must be greater than 0.",
                });
            }

            if (stop_limit <= 0) {
                return res.json({
                    status: "fail",
                    message: "Stop limit must be greater than 0.",
                });
            }

            if (type == "buy") {
                if (stop_limit < target_price) {
                    return res.json({
                        status: "fail",
                        message: "Stop limit price can't be greater then target price",
                    });
                }

                if (target_price >= price) {
                    return res.json({
                        status: "fail",
                        message: "Buy limit order must be below the price",
                    });
                }
            }

            if (type == "sell") {
                if (stop_limit > target_price) {
                    return res.json({
                        status: "fail",
                        message: "Stop limit price can't be smaller then target price",
                    });

                }
                if (target_price <= price) {
                    return res.json({
                        status: "fail",
                        message: "Price can't be smaller than stop price",
                    });

                }
            }


            amount =
                ((userBalance.amount * percent) / 100 / target_price) *
                req.body.leverage;
            let usedUSDT = (amount * target_price) / req.body.leverage;

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
                stop_limit: stop_limit,
                leverage: leverage,
                amount: amount,
                open_price: target_price,
                status: 1,
            });
            await order.save();
            const fee = (amount * getPair.tradeFee) / 100;
            await setFeeCredit(user_id, getPair._id, fee);
            if (apiResult === false) {
                apiRequest.status = 1;
                await apiRequest.save();
            }
            return res.json({ status: "success", data: order });
        } else if (method == "market") {

            let amount =
                ((userBalance.amount * percent) / 100 / price) * req.body.leverage;
            let usedUSDT = (amount * price) / req.body.leverage;
            const fee = usedUSDT * (type == 'buy' ? 0.03 : 0.06) / 100.0;
            let totalUsedUSDT = usedUSDT - fee;

            let reverseOreders = await FutureOrder.findOne({
                user_id: req.body.user_id,
                pair_id: getPair._id,
                future_type: future_type,
                method: "market",
                status: 0,
            }).exec();

            if (reverseOreders) {
                if (reverseOreders.leverage > leverage) {
                    return res.json({ status: "fail", message: "Leverage cannot be smaller" });
                    return;
                }
                if (reverseOreders.type == type) {
                    let oldAmount = reverseOreders.amount;
                    let oldUsedUSDT = reverseOreders.usedUSDT;
                    let oldPNL = reverseOreders.pnl;
                    let oldLeverage = reverseOreders.leverage;
                    let newUsedUSDT = oldUsedUSDT + totalUsedUSDT + oldPNL;

                    reverseOreders.usedUSDT = newUsedUSDT;
                    reverseOreders.open_price = price;
                    reverseOreders.pnl = 0;
                    reverseOreders.fee += fee;
                    reverseOreders.leverage = leverage;
                    reverseOreders.open_time = Date.now();
                    reverseOreders.amount = splitLengthNumber((newUsedUSDT * leverage) / price);
                    userBalance = await FutureWalletModel.findOne({
                        user_id: req.body.user_id,
                    }).exec();
                    userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                    await userBalance.save();

                    await reverseOreders.save();
                    if (apiResult === false) {
                        apiRequest.status = 1;
                        await apiRequest.save();
                    }
                    await setFeeCredit(user_id, getPair._id, fee);
                    return res.json({ status: "success", data: reverseOreders });
                    return;
                } else {
                    //Tersine ise
                    let checkusdt =
                        (reverseOreders.usedUSDT + reverseOreders.pnl) *
                        reverseOreders.leverage;
                    if (checkusdt == totalUsedUSDT * leverage) {
                        reverseOreders.status = 1;
                        userBalance = await FutureWalletModel.findOne({
                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount =
                            userBalance.amount +
                            reverseOreders.pnl +
                            reverseOreders.usedUSDT;
                        reverseOreders.fee += fee;
                        await userBalance.save();
                        await reverseOreders.save();
                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        await setFeeCredit(user_id, getPair._id, fee);
                        return res.json({ status: "success", data: reverseOreders });
                        return;
                    }

                    if (checkusdt > totalUsedUSDT * leverage) {
                        let writeUsedUSDT =
                            reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                        if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                        reverseOreders.usedUSDT = writeUsedUSDT;
                        reverseOreders.fee += fee;
                        reverseOreders.amount =
                            (writeUsedUSDT * reverseOreders.leverage) / price;
                        userBalance = await FutureWalletModel.findOne({
                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount = splitLengthNumber(userBalance.amount + usedUSDT);
                        await userBalance.save();
                        await reverseOreders.save();
                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        await setFeeCredit(user_id, getPair._id, fee);
                        return res.json({ status: "success", data: reverseOreders });
                        return;
                    } else {
                        /*
                          20 lik işlem var
                          50 luk ters işlem açıyor
                          toplam da 10 luk pozisyon olacak
          
          
                        */
                        let ilkIslem = reverseOreders.usedUSDT + reverseOreders.pnl;
                        let tersIslem = totalUsedUSDT;
                        let data = tersIslem - ilkIslem;
                        if (data < 0) {
                            data *= -1;
                        }
                        userBalance = await FutureWalletModel.findOne({
                            user_id: req.body.user_id,
                        }).exec();
                        userBalance.amount = userBalance.amount + (ilkIslem - data);
                        //userBalance.amount = splitLengthNumber(userBalance.amount + data);
                        await userBalance.save();

                        reverseOreders.type = type;
                        reverseOreders.leverage = leverage;
                        let writeUsedUSDT =
                            reverseOreders.usedUSDT + reverseOreders.pnl - totalUsedUSDT;
                        if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                        reverseOreders.usedUSDT = writeUsedUSDT;
                        //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
                        reverseOreders.amount = splitLengthNumber((writeUsedUSDT * leverage) / price);
                        reverseOreders.fee += fee;
                        await reverseOreders.save();
                        if (apiResult === false) {
                            apiRequest.status = 1;
                            await apiRequest.save();
                        }
                        await setFeeCredit(user_id, getPair._id, fee);
                        return res.json({ status: "success", data: reverseOreders });
                        return;
                    }
                }
            } else {
                userBalance = await FutureWalletModel.findOne({
                    user_id: user_id,
                }).exec();
                userBalance.amount = splitLengthNumber(userBalance.amount - usedUSDT);
                await userBalance.save();
                let order = new FutureOrder({
                    pair_id: getPair._id,
                    pair_name: getPair.name,
                    type: type,
                    fee: fee,
                    future_type: future_type,
                    method: method,
                    user_id: user_id,
                    usedUSDT: totalUsedUSDT,
                    required_margin: totalUsedUSDT,
                    isolated: totalUsedUSDT,
                    sl: req.body.sl ?? 0,
                    tp: req.body.tp ?? 0,
                    target_price: 0.0,
                    leverage: leverage,
                    amount: amount,
                    open_price: price,
                    status: 0
                });
                await order.save();
                await setFeeCredit(req.body.user_id, getPair._id, fee);
                if (apiResult === false) {
                    apiRequest.status = 1;
                    await apiRequest.save();
                }
                await setFeeCredit(user_id, getPair._id, fee);
                return res.json({ status: "success", data: order });
                return;
            }
        } else {
            return res.json({ 'status': 'fail', 'message': 'Cannot method' })
        }
    } else {
        return res.json({ 'status': 'fail', 'message': 'Cannot future type' })
    }

}
module.exports = addFutureOrder;