const { default: axios } = require("axios");
const SetTradeVolumeAndRefProgram = require("../../Functions/setTradeVolumeAndRefProgram");
const Orders = require("../../models/Orders");
const Pairs = require("../../models/Pairs");
const Wallet = require("../../models/Wallet");
const setFeeCredit = require("../bonus/setFeeCredit");

var authFile = require("../../auth");

const EditSpotOrder = async (req, res) => {


    let result = await authFile.apiKeyChecker(req.body.api_key);

    if (result !== true)
        return res.json({ 'status': 'fail', 'message': 'Invalid API key' });

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

    let required = ['user_id', 'order_id', 'percent', 'target_price'];


    for (var i = 0; i < required.length; i++) {
        if (req.body[required[i]] == null) {
            return res.json({ 'status': 'fail', 'message': 'Parameter not found' });
        }
    }
    let order_id = req.body.order_id;
    let user_id = req.body.user_id;
    let target_price = req.body.target_price;
    let percent = req.body.percent;

    if (percent <= 0) {
        return res.json({ 'status': 'fail', 'message': 'Invalid amount' });
    }

    let relevantOrder = await Orders.findOne({ _id: order_id, user_id: user_id, status: 1 });
    if (relevantOrder == null)
        return res.json({ 'status': 'fail', 'message': 'Order not found' });
    if (relevantOrder.type == 'limit') {
        var urlPair = relevantOrder.pair_name.replace("/", "");
        let url =
            'http://global.oxhain.com:8542/price?symbol=' + urlPair;
        let result = await axios(url);
        let price = result.data.data.ask;



        var getPair = await Pairs.findOne({ name: relevantOrder.pair_name }).exec();
        var fromWallet = await Wallet.findOne({
            coin_id: getPair.symbolOneID,
            user_id: user_id,
        }).exec();
        var towallet = await Wallet.findOne({
            coin_id: getPair.symbolTwoID,
            user_id: user_id,
        }).exec();


        if (relevantOrder.method == 'buy') {
            let balance = towallet.amount + (relevantOrder.target_price * relevantOrder.amount);
            let amount = (balance * percent / 100.0) / target_price;
            let total = amount * target_price;
            amount = splitLengthNumber(amount);
            total = splitLengthNumber(total);
            if (amount <= 0) {
                return res.json({ status: "fail", message: "Invalid amount" });
            }

            if (balance < total) {
                return res.json({ status: "fail", message: "Invalid  balance" });
            }
            if (target_price >= price) {
                const fee = splitLengthNumber((total * getPair.spot_fee) / 100.0);
                const feeToAmount = splitLengthNumber((fee / target_price));
                const buyAmount = splitLengthNumber((amount - feeToAmount));

                relevantOrder.status = 0;
                await relevantOrder.save();
                let newOrder = new Orders({
                    pair_id: relevantOrder.pair_id,
                    pair_name: relevantOrder.pair_name,
                    type: 'market',
                    user_id: relevantOrder.user_id,
                    amount: buyAmount,
                    target_price: 0,
                    method: 'buy',
                    stop_limit: 0,
                    open_price: 0,
                    feeUSDT: fee,
                    feeAmount: feeToAmount,
                    limit_order_id: relevantOrder._id,
                    status: 0,
                });
                await newOrder.save();

                fromWallet.amount = parseFloat(fromWallet.amount) + parseFloat(buyAmount);
                towallet.amount = parseFloat(towallet.amount) - parseFloat(total);

                await fromWallet.save();
                await towallet.save();
                await SetTradeVolumeAndRefProgram({ order_id: newOrder._id, user_id: user_id, trade_from: "spot", trade_type: "buy", amount: amount, totalUSDT: splitLengthNumber(total) })
                await setFeeCredit(req.body.user_id, getPair.symbolTwoID, fee);
            } else {

                let beforeTotal = relevantOrder.target_price * relevantOrder.amount;
                let total = target_price * amount;
                let refund = total - beforeTotal;
                relevantOrder.target_price = target_price;
                relevantOrder.amount = amount;
                towallet.amount = splitLengthNumber(towallet.amount) - splitLengthNumber(refund);
                await towallet.save();
                await relevantOrder.save();
            }

        }

        else if (relevantOrder.method == 'sell') {
            let balance = fromWallet.amount + relevantOrder.amount;
            let amount = (balance * percent / 100.0);
            amount = splitLengthNumber(amount);
            if (amount <= 0) {
                return res.json({ status: "fail", message: "Invalid amount" });
            }

            if (balance < amount) {
                return res.json({ status: "fail", message: "Invalid  balance" });
            }

            if (target_price <= price) {
                let beforeAmount = relevantOrder.amount;

                let total = amount * target_price;
                total = splitLengthNumber(total);
                const fee = splitLengthNumber((total * getPair.spot_fee) / 100.0);
                const feeToAmount = splitLengthNumber((fee / price));
                const sellAmount = splitLengthNumber((amount - feeToAmount));
                const addUSDTAmount = splitLengthNumber(parseFloat(sellAmount) * price);



                const newOrder = new Orders({
                    pair_id: getPair.symbolOneID,
                    second_pair: getPair.symbolTwoID,
                    pair_name: getPair.name,
                    user_id: user_id,
                    amount: sellAmount,
                    open_price: target_price,
                    feeUSDT: fee,
                    feeAmount: feeToAmount,
                    type: "market",
                    method: "sell",
                    target_price: 0,
                    status: 0,
                    limit_order_id: relevantOrder._id,
                });
                relevantOrder.status = 0;
                await relevantOrder.save();
                await newOrder.save();
                fromWallet.amount = fromWallet.amount - amount;
                towallet.amount = towallet.amount + parseFloat(addUSDTAmount);
                await fromWallet.save();
                await towallet.save();


                await SetTradeVolumeAndRefProgram({ order_id: newOrder._id, user_id: user_id, trade_from: "spot", trade_type: "sell", amount: amount, totalUSDT: splitLengthNumber(total) });
                await setFeeCredit(user_id, getPair.symbolTwoID, fee);
                return res.json({ status: "success", data: "ok" });
            } else {
                let beforeAmount = relevantOrder.amount;
                let refund = amount - beforeAmount;
                relevantOrder.target_price = target_price;
                relevantOrder.amount = amount;
                fromWallet.amount = splitLengthNumber(fromWallet.amount) - refund;
                await fromWallet.save();
                await relevantOrder.save();
            }
        }

        return res.json({ status: "success", data: "OK" });
    }

    else if (relevantOrder.type == 'limit') {
        let stop_limit = req.body.stop_limit;
        if (stop_limit == null || stop_limit == '') return res.json({ 'status': 'fail', 'message': 'Invalid parameter' });
        var urlPair = relevantOrder.pair_name.replace("/", "");
        let url =
            'http://global.oxhain.com:8542/price?symbol=' + urlPair;
        let result = await axios(url);
        let price = result.data.data.ask;

        var getPair = await Pairs.findOne({ name: relevantOrder.pair_name }).exec();
        var fromWallet = await Wallet.findOne({
            coin_id: getPair.symbolOneID,
            user_id: user_id,
        }).exec();
        var towallet = await Wallet.findOne({
            coin_id: getPair.symbolTwoID,
            user_id: user_id,
        }).exec();


        if (relevantOrder.method == 'buy') {
            let balance = towallet.amount + (relevantOrder.target_price * relevantOrder.amount);
            let amount = (balance * percent / 100.0) / target_price;
            let total = amount * target_price;
            amount = splitLengthNumber(amount);
            total = splitLengthNumber(total);
            if (amount <= 0) {
                return res.json({ status: "fail", message: "Invalid amount" });
            }

            if (balance < total) {
                return res.json({ status: "fail", message: "Invalid  balance" });
            }


            let beforeTotal = relevantOrder.target_price * relevantOrder.amount;
            total = target_price * amount;
            let refund = total - beforeTotal;
            relevantOrder.target_price = target_price;
            relevantOrder.stop_limit = stop_limit;
            relevantOrder.amount = amount;
            towallet.amount = splitLengthNumber(towallet.amount) - splitLengthNumber(refund);
            await towallet.save();
            await relevantOrder.save();

        }

        else if (relevantOrder.method == 'sell') {
            let balance = fromWallet.amount + relevantOrder.amount;
            let amount = (balance * percent / 100.0);
            amount = splitLengthNumber(amount);
            if (amount <= 0) {
                return res.json({ status: "fail", message: "Invalid amount" });
            }

            if (balance < amount) {
                return res.json({ status: "fail", message: "Invalid  balance" });
            }

            let beforeAmount = relevantOrder.amount;
            let refund = amount - beforeAmount;
            relevantOrder.stop_limit = stop_limit;
            relevantOrder.target_price = target_price;
            relevantOrder.amount = amount;
            fromWallet.amount = splitLengthNumber(fromWallet.amount) - refund;
            await fromWallet.save();
            await relevantOrder.save();
        }

        return res.json({ status: "success", data: "OK" });
    } else {
        return res.json({ 'status': 'fail', 'message': 'Order not found' });
    }
}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}


module.exports = EditSpotOrder;