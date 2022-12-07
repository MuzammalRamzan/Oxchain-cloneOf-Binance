const { createHash } = require("crypto");
const mongoose = require("mongoose");
const WebSocket = require('ws');
const Orders = require("./models/Orders");
const Pairs = require("./models/Pairs");
const Wallet = require("./models/Wallet");
require("dotenv").config();
const Connection = require('./Connection');
const { default: axios } = require("axios");
async function main() {
    var mongodbPass = process.env.MONGO_DB_PASS;

    Connection.connection();


    let request = { $and: [{ status: { $gt: 0 } }, { $or: [{ type: "limit" }, { type: "stop_limit" }] }] };
    let orders = await Orders.find(request).exec();
    await Run(orders);
    let isInsert = Orders.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        //orders = data;
        orders = await Orders.find(request).exec();
        await Run(orders);
    });


}

async function Run(orders) {


    for (var k = 0; k < orders.length; k++) {
        let order = orders[k];

        let target_price = parseFloat(order.target_price);
        
        if (order.type == 'limit') {
            if (order.status == 0) continue;
            if (order.method == 'buy') {
                let getPrice = await axios("http://18.130.193.166:8542/price?symbol=" + order.pair_name.replace("/", ""));
                let price = getPrice.data.data.ask;
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
                        target_price: order.target_price,
                        status: 0,
                    });

                    order.status = 0;
                    await order.save();
                    let saved = await neworders.save();
                    if (saved) {
                        console.log(toWalelt);
                        console.log(toWalelt.amount);
                        fromWalelt.amount = parseFloat(fromWalelt.amount) + order.amount;
                        //toWalelt.amount = parseFloat(toWalelt.amount) - total;
                        //await toWalelt.save();
                        await fromWalelt.save();
                    }
                }
            }
            if (order.method == 'sell') {
                let getPrice = await axios("http://18.130.193.166:8542/price?symbol=" + order.pair_name.replace("/", ""));
                let price = getPrice.data.data.bid;
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
                        target_price: order.target_price,
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
            let getPrice = await axios("http://18.130.193.166:8542/price?symbol=" + order.pair_name.replace("/", ""));
            let price = getPrice.data.data.ask;
            
            console.log(target_price + " | " + stop_limit + " | " + price);
            if (order.method == 'buy') {
                //CHECK TP
                if (price <= stop_limit) {
                    console.log("alış gerçekleşiyor");
                    order.type = 'limit';
                    await order.save();

                }
            } else if (order.method == 'sell') {
                if (price >= stop_limit) {
                    console.log("satış gerçekleşiyor");
                    order.type = 'limit';
                    await order.save();

                }
            }
        }
    }

}
main();