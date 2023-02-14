const { createHash } = require("crypto");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const Orders = require("./models/Orders");
const Pairs = require("./models/Pairs");
const Wallet = require("./models/Wallet");
require("dotenv").config();
const Connection = require('./Connection');
const { default: axios } = require("axios");
const SiteNotificaitonModel = require("./models/SiteNotifications");
const UserNotifications = require("./models/UserNotifications");
const User = require("./models/User");
const { Scheduler } = require("aws-sdk");
const schedule = require('node-schedule');
const mailer = require("./mailer");
const CoinList = require("./models/CoinList");
var MarketData = {};

async function main() {
    await Connection.connection();

    let coinList = await CoinList.find({});

    for (var k = 0; k < coinList.length; k++) {
        MarketData[coinList[k].symbol + "USDT"] = { bid: 0.0, ask: 0.0 };
    }

    let request = { $and: [{ status: { $gt: 0 } }, { $or: [{ type: "limit" }, { type: "stop_limit" }] }] };
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0


    var b_ws = new WebSocket("wss://global.oxhain.com:7010");


    b_ws.onopen = (event) => {
        b_ws.send(JSON.stringify({ page: "all_prices" }));
    };

    // Reconnect connection when disconnect connection
    b_ws.onclose = () => {
        //b_ws.send(JSON.stringify(initSocketMessage));
    };
    b_ws.onmessage = async function (event) {
        const data = JSON.parse(event.data);
        if (data != null && data != "undefined") {
            for (key in data) {
                MarketData[key] = data[key];
            }

            let orders = await Orders.find(request).exec();
            await Run(orders);

        }
    };

}

async function Run(orders) {


    for (var k = 0; k < orders.length; k++) {
        let order = orders[k];
        let price = MarketData[order.pair_name.replace('/', '')];
        if (price == null) continue;
        price = price.ask;
        if (price <= 0) continue;
        let target_price = parseFloat(order.target_price);

        if (order.type == 'limit') {
            if (order.status == 0) continue;
            if (order.method == 'buy') {
                if (price <= target_price) {
                    await Orders.updateOne({ _id: order._id }, { $set: { status: 0 } });
                    var getPair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();
                    var fromWalelt = await Wallet.findOne({
                        coin_id: getPair.symbolOneID,
                        user_id: order.user_id,
                    }).exec();
                    var toWalelt = await Wallet.findOne({
                        coin_id: getPair.symbolTwoID,
                        user_id: order.user_id,
                    }).exec();
                    let total = parseFloat(order.amount) * parseFloat(order.target_price);
                    const fee = splitLengthNumber((total * getPair.spot_fee) / 100.0);
                    const feeToAmount = splitLengthNumber((fee / price));
                    const buyAmount = splitLengthNumber((order.amount - feeToAmount));
                    const neworders = new Orders({
                        pair_id: getPair.symbolOneID,
                        second_pair: getPair.symbolTwoID,
                        pair_name: getPair.name,
                        user_id: order.user_id,
                        amount: parseFloat(buyAmount),
                        open_price: price,
                        feeUSDT: fee,
                        feeAmount: feeToAmount,
                        open_time: Date.now(),
                        limit_order_id: order._id,
                        type: "market",
                        method: "buy",
                        target_price: order.target_price,
                        status: 0,
                    });

                    let user = await User.findOne({ _id: order.user_id });
                    let SiteNotificaitonsCheck = await SiteNotificaitonModel.findOne({ user_id: user._id });


                    if (SiteNotificaitonsCheck != null && SiteNotificaitonsCheck != '') {

                        if (SiteNotificaitonsCheck.trade == 1) {
                            let newNotification = new UserNotifications({
                                user_id: user._id,
                                title: "Order Filled",
                                message: "Your order has been filled",
                                read: false
                            });

                            await newNotification.save();

                            if (user.email != null && user.email != '') {

                                mailer.sendMail(user.email, "Order Filled", "Your order has been filled");
                            }

                        }

                    }


                    order.status = 0;
                    await order.save();
                    let saved = await neworders.save();
                    if (saved) {
                        fromWalelt.amount = parseFloat(fromWalelt.amount) + parseFloat(buyAmount);
                        //toWalelt.amount = parseFloat(toWalelt.amount) - total;
                        //await toWalelt.save();
                        await fromWalelt.save();
                    }
                }
            }
            if (order.method == 'sell') {
                if (price >= target_price) {
                    await Orders.updateOne({ _id: order._id }, { $set: { status: 0 } });

                    var getPair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();
                    var fromWalelt = await Wallet.findOne({
                        coin_id: getPair.symbolOneID,
                        user_id: order.user_id,
                    }).exec();
                    var toWalelt = await Wallet.findOne({
                        coin_id: getPair.symbolTwoID,
                        user_id: order.user_id,
                    }).exec();


                    let total = parseFloat(order.amount) * price;
                    const fee = splitLengthNumber((total * getPair.spot_fee) / 100.0);
                    const feeToAmount = splitLengthNumber((fee / price));
                    const sellAmount = splitLengthNumber((order.amount - feeToAmount));
                    const addUSDTAmount = splitLengthNumber(parseFloat(sellAmount) * price);

                    const neworders = new Orders({
                        pair_id: getPair.symbolOneID,
                        second_pair: getPair.symbolTwoID,
                        pair_name: getPair.name,
                        user_id: order.user_id,
                        feeUSDT: fee,
                        feeAmount: feeToAmount,
                        amount: parseFloat(order.amount),
                        open_price: price,
                        open_time: Date.now(),
                        type: "market",
                        method: "sell",
                        target_price: order.target_price,
                        status: 0,
                    });
                    order.status = 0;
                    await order.save();

                    await neworders.save();

                    //fromWalelt.amount = parseFloat(fromWalelt.amount) - order.amount;
                    toWalelt.amount = parseFloat(toWalelt.amount) + addUSDTAmount;
                    await toWalelt.save();
                    //await fromWalelt.save();

                }
            }
        } else if (order.type == 'stop_limit') {
            if (order.status == 0) continue;
            let target_price = parseFloat(order.target_price);
            let stop_limit = parseFloat(order.stop_limit);

            if (order.method == 'buy') {
                //CHECK TP
                if (price <= stop_limit) {
                    order.type = 'limit';
                    await order.save();

                }
            } else if (order.method == 'sell') {
                if (price >= stop_limit) {
                    order.type = 'limit';
                    await order.save();

                }
            }
        }
    }

}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}
main();