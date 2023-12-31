const { default: axios } = require("axios");
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");
var authFile = require("../../auth.js");

const FuturePercentClose = async (req, res) => {

    try {


        let api_key_result = req.body.api_key;
        let result = await authFile.apiKeyChecker(api_key_result);
        if (result == false) {
            return res.json({ status: "fail", message: "Forbidden 403" });
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


        let user_id = req.body.user_id;
        let order_id = req.body.order_id;
        let percent = req.body.percent ?? 0.0;
        console.log(user_id, order_id, percent);
        let order = await FutureOrder.findOne({ _id: order_id, user_id: user_id, method: 'market', status: 0 });
        if (order == null) {
            console.log("Order not found");
            return res.json({ status: 'fail', message: 'Order not found', showableMessage: 'Order not found' });
        }
        let binanceData = await axios("http://global.oxhain.com:8542/price?symbol=" + order.pair_name.replace('/', ''));

        if (binanceData != null) {

            let order = await FutureOrder.findOne({ _id: order_id, user_id: user_id, method: 'market', status: 0 });
            if (order == null) {
                res.json({ status: 'fail', message: 'Order not found' });
                console.log("Order not found");
                return;
            }

            let wallet = await FutureWalletModel.findOne({ user_id: user_id });
            if (wallet == null) {
                console.log("Wallet not found");
                res.json({ status: 'fail', message: 'User not found' });
                return;
            }
            let marketPrice = parseFloat(binanceData.data.data.ask);
            console.log(order.amount, percent, marketPrice);
            percent = parseFloat(percent);


            if (percent == 100) {


                console.log("%100, kapanıyor");
                let updateOrder = await FutureOrder.findOneAndUpdate(
                    { user_id: user_id, _id: order._id, method: 'market', status: 0 },
                    { status: 1 }
                );
                console.log(updateOrder);
                if (updateOrder == null) {
                    return res.json({ status: 'fail', message: 'Order not found', alert: "Order not found" });

                } else {

                    console.log("Order updated");
                    let updateWallet = await FutureWalletModel.findOneAndUpdate(
                        { user_id: user_id, _id: wallet._id },
                        { $inc: { amount: (parseFloat(order.usedUSDT) + parseFloat(order.pnl)) } }
                    );

                    if (updateWallet == null) {
                        return res.json({ status: 'fail', message: 'Wallet not found', alert: "Wallet not found" });
                    }
                    else {
                        console.log("Wallet updated");
                    }
                }

                console.log("Aktarılacak miktar: ", (parseFloat(order.usedUSDT) + parseFloat(order.pnl)));
                console.log("Order ID : ", order._id);
                console.log("Wallet ID : ", wallet._id);

                let leverage = order.leverage;
                let type = order.type == "buy" ? "sell" : "buy";
                const fee = (order.usedUSDT + order.pnl) * leverage * (type == 'buy' ? 0.03 : 0.06) / 100.0;

                //CREATE NEW ORDER AS MARKET AND OPPOSITE SIDE
                let newOrder = new FutureOrder(
                    {
                        pair_id: order.pair_id,
                        pair_name: order.pair_name,
                        fee: fee,
                        type: order.type == "buy" ? "sell" : "buy",
                        future_type: order.future_type,
                        method: "market",
                        user_id: user_id,
                        usedUSDT: order.usedUSDT + order.pnl,
                        required_margin: order.required_margin,
                        isolated: order.isolated,
                        target_price: 0.0,
                        leverage: order.leverage,
                        amount: order.amount,
                        open_price: marketPrice,
                        status: 1
                    }
                )

                await newOrder.save();

                return res.send({ status: 'success', data: 'OK' });


            } else {

                console.log("%100 değil, kısmi kapanıyor");
                let orderTotal = order.usedUSDT + order.pnl;
                let totalUSDT = parseFloat(orderTotal) * percent / 100.0;
                let totalAmount = parseFloat(order.amount) * percent / 100.0;
                order.usedUSDT = order.usedUSDT + order.pnl;
                order.pnl = 0;
                order.usedUSDT = parseFloat(totalUSDT);
                order.amount = parseFloat(order.amount) - totalAmount;
                await order.save();
                console.log(wallet.amount, (orderTotal - totalUSDT));
                wallet.amount = parseFloat(wallet.amount) + (orderTotal - totalUSDT);
                await wallet.save();

                const fee = (order.usedUSDT + pnl) * leverage * (type == 'buy' ? 0.03 : 0.06) / 100.0;

                //CREATE NEW ORDER AS MARKET AND OPPOSITE SIDE
                let newOrder = new FutureOrder(
                    {
                        pair_name: order.name,
                        fee: fee,
                        type: order.type == "buy" ? "sell" : "buy",
                        future_type: order.future_type,
                        method: "market",
                        user_id: user_id,
                        usedUSDT: totalUSDT,
                        required_margin: totalUSDT,
                        isolated: totalUSDT,
                        target_price: 0.0,
                        leverage: order.leverage,
                        amount: totalAmount,
                        open_price: marketPrice,
                        status: 1
                    }
                )

                await newOrder.save();

                return res.send({ status: 'success', data: 'OK' });
            }
        }
    }
    catch (err) {
        console.log(err);
    }



}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}

module.exports = FuturePercentClose;