const { createHash } = require("crypto");
const mongoose = require("mongoose");
const WebSocket = require('ws');
const Orders = require("./models/Orders");
const Pairs = require("./models/Pairs");
const Wallet = require("./models/Wallet");
require("dotenv").config();
const Connection = require('./Connection');
async function main() {
    var mongodbPass = process.env.MONGO_DB_PASS;

    Connection.connection();


    let request = { $and: [{ status: { $gt: 0 } }, { $or: [{ type: "limit" }, { type: "stop_limit" }] }] };
    let orders = await Orders.find(request).exec();

    let isInsert = Orders.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
        //orders = data;
        orders = await Orders.find(request).exec();
    });
    let isUpdate = Orders.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
        orders = await Orders.find(request).exec();
    });
    let isRemove = Orders.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
        console.log("silindi");
        orders = await Orders.find(request).exec();
    });

    let isDelete = Orders.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
        console.log("silindi 2");
        orders = await Orders.find(request).exec();
    });
    const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    allTickers.onopen = () => {
        allTickers.onmessage = async (data) => {
            let list = JSON.parse(data.data);
            for (var i = 0; i < list.length; i++) {
                let symbol = list[i].s.replace("/", "");
                for (var k = 0; k < orders.length; k++) {
                    let order = orders[k];
                    if (order.pair_name.replace('/', '') == symbol.replace('/', '')) {
                        let target_price = parseFloat(order.target_price);
                        if (order.type == 'limit') {
                            if (order.status == 0) continue;
                            if (order.method == 'buy') {
                                let price = parseFloat(list[i].a);
                                console.log(order.target_price + "  | " + price);
                                if (price <= target_price) {
                                    await Orders.updateOne({ _id: order._id }, { $set: { status: 0 } });

                                    console.log("alış gerçekleşiyor");
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
                                    console.log("total : ", total);
                                    const neworders = new Orders({
                                        pair_id: getPair.symbolOneID,
                                        second_pair: getPair.symbolTwoID,
                                        pair_name: getPair.name,
                                        user_id: order.user_id,
                                        amount: parseFloat(order.amount),
                                        open_price: price,
                                        open_time: Date.now(),
                                        type: "market",
                                        method: "buy",
                                        target_price: 0,
                                        status: 0,
                                    });

                                    order.status = 0;
                                    await order.save();
                                    let saved = await neworders.save();
                                    if (saved) {
                                        console.log(toWalelt);
                                        console.log(toWalelt.amount);
                                        fromWalelt.amount = parseFloat(fromWalelt.amount) + order.amount;
                                        toWalelt.amount = parseFloat(toWalelt.amount) - total;
                                        await toWalelt.save();
                                        await fromWalelt.save();
                                    }
                                }
                            }
                            if (order.method == 'sell') {
                                let price = parseFloat(list[i].b);
                                if (price >= target_price) {
                                    await Orders.updateOne({ _id: order._id }, { $set: { status: 0 } });

                                    console.log("satış gerçekleşiyor");
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
                                    console.log("total : ", total);
                                    const neworders = new Orders({
                                        pair_id: getPair.symbolOneID,
                                        second_pair: getPair.symbolTwoID,
                                        pair_name: getPair.name,
                                        user_id: order.user_id,
                                        amount: parseFloat(order.amount),
                                        open_price: price,
                                        open_time: Date.now(),
                                        type: "market",
                                        method: "sell",
                                        target_price: 0,
                                        status: 0,
                                    });

                                    order.status = 0;
                                    await order.save();
                                    let saved = await neworders.save();
                                    if (saved) {
                                        console.log(toWalelt);
                                        console.log(toWalelt.amount);
                                        //fromWalelt.amount = parseFloat(fromWalelt.amount) - order.amount;
                                        toWalelt.amount = parseFloat(toWalelt.amount) + total;
                                        await toWalelt.save();
                                        //await fromWalelt.save();
                                    }
                                }
                            }
                        } else if (order.type == 'stop_limit') {
                            if (order.status == 0) continue;
                            let target_price = parseFloat(order.target_price);
                            let stop_limit = parseFloat(order.stop_limit);
                            let price = parseFloat(list[i].a);
                            console.log(target_price + " | " + stop_limit + " | " + price);
                            if (order.method == 'buy') {
                                //CHECK TP
                                if (price <= target_price) {
                                    console.log("alış gerçekleşiyor");
                                    var getPair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();
                                    var fromWalelt = await Wallet.findOne({
                                        coin_id: getPair.symbolOneID,
                                        user_id: order.user_id,
                                    }).exec();
                                    var toWalelt = await Wallet.findOne({
                                        coin_id: getPair.symbolTwoID,
                                        user_id: order.user_id,
                                    }).exec();
                                    let before_total = parseFloat(order.amount) * parseFloat(order.target_price);
                                    let after_total = parseFloat(order.amount) * parseFloat(order.stop_limit);
                                    let total = after_total - before_total;
                                    console.log("total : ", total);
                                    const neworders = new Orders({
                                        pair_id: getPair.symbolOneID,
                                        second_pair: getPair.symbolTwoID,
                                        pair_name: getPair.name,
                                        user_id: order.user_id,
                                        amount: parseFloat(order.amount),
                                        open_price: stop_limit,
                                        type: "market",
                                        method: "buy",
                                        target_price: 0,
                                        status: 0,
                                    });

                                    order.status = 0;
                                    await order.save();
                                    let saved = await neworders.save();
                                    if (saved) {
                                        console.log(toWalelt);
                                        console.log(toWalelt.amount);
                                        fromWalelt.amount = parseFloat(fromWalelt.amount) + order.amount;
                                        toWalelt.amount = parseFloat(toWalelt.amount) - total;
                                        await toWalelt.save();
                                        await fromWalelt.save();
                                    }
                                }
                            } else if (order.method == 'sell') {
                                if (price >= target_price) {
                                    console.log("satış gerçekleşiyor");
                                    var getPair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();
                                    var fromWalelt = await Wallet.findOne({
                                        coin_id: getPair.symbolOneID,
                                        user_id: order.user_id,
                                    }).exec();
                                    var toWalelt = await Wallet.findOne({
                                        coin_id: getPair.symbolTwoID,
                                        user_id: order.user_id,
                                    }).exec();

                                    let total = parseFloat(order.amount) * stop_limit;
                                    console.log("total : ", total);
                                    const neworders = new Orders({
                                        pair_id: getPair.symbolOneID,
                                        second_pair: getPair.symbolTwoID,
                                        pair_name: getPair.name,
                                        user_id: order.user_id,
                                        amount: parseFloat(order.amount),
                                        open_price: stop_limit,
                                        type: "market",
                                        method: "sell",
                                        target_price: 0,
                                        status: 0,
                                    });

                                    order.status = 0;
                                    await order.save();
                                    let saved = await neworders.save();
                                    if (saved) {
                                        console.log(toWalelt);
                                        console.log(toWalelt.amount);
                                        //fromWalelt.amount = parseFloat(fromWalelt.amount) - order.amount;
                                        toWalelt.amount = parseFloat(toWalelt.amount) + total;
                                        await toWalelt.save();
                                        //await fromWalelt.save();
                                    }
                                }
                            }
                        }

                    }
                }
            }
        }
    }
}
main();