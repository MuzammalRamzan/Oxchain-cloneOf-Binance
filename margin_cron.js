require("dotenv").config();
const WebSocket = require('ws');
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
const MarginOrder = require('./models/MarginOrder.js');
const mongoose = require("mongoose");
const Wallet = require("./models/Wallet.js");
var mongodbPass = process.env.MONGO_DB_PASS;

const io = new Server();
var mongodbPass = process.env.MONGO_DB_PASS;
const ContractSize = 100000000.0;
var connection =
    "mongodb+srv://volkansaka:" +
    mongodbPass +
    "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority";
const MarginWalletId = "62ff3c742bebf06a81be98fd";
async function initialize() {
    await mongoose.connect(connection);

    //await mongoClient.connect();



    /*
  
    await mongoCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 3600, background: true }
    );
    */
    let request = { status: 0, method: "market" };
    let orders = await MarginOrder.find(request).exec();


    let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
        //orders = data;
        orders = await MarginOrder.find(request).exec();

    });
    let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
        orders = await MarginOrder.find(request).exec();
    });
    let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
        console.log("silindi");
        orders = await MarginOrder.find(request).exec();
    });

    let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
        console.log("silindi 2");
        orders = await MarginOrder.find(request).exec();

    });



    const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    allTickers.onopen = () => {
        allTickers.onmessage = async (data) => {
            let list = JSON.parse(data.data);
            for (var i = 0; i < list.length; i++) {
                let symbol = list[i].s.replace("/", "");
                let totalPNL = 0.0;

                for (var k = 0; k < orders.length; k++) {
                    let order = orders[k];
                    let userBalance = await Wallet.findOne({ user_id: order.user_id, coin_id: MarginWalletId });

                    if (order.pair_name.replace('/', '') == symbol) {

                        let balance = 0.00;
                        if (order.method == 'limit') {
                            let ask = parseFloat(list[i].a);
                            let bid = parseFloat(list[i].b);
                            let target_price = parseFloat(order.target_price) ?? 0.0;
                            console.log(target_price + " | " + ask + " | ");
                            if (order.margin_type == 'cross')
                                balance = (userBalance.amount * 1.0).toFixed(2);
                            else if (order.margin_type == 'isolated')
                                balance = order.isolated;

                            if (order.type == 'buy') {
                                if (ask <= target_price) {
                                    let imr = 1 / order.leverage;
                                    let initialMargin = order.amount * ask * imr;
                                    if (balance >= initialMargin) {
                                        console.log("buy margin start");
                                        order.initialMargin = initialMargin;
                                        order.method = 'market';
                                        userBalance.amount = parseFloat(userBalance.amount) - initialMargin;
                                        order.open_time = Date.now();
                                        order.open_price = ask;
                                        order.status = 1;
                                        await order.save();
                                        await userBalance.save();
                                    } else {
                                        order.close_time = Date.now();
                                        order.status = -1;
                                        await order.save();
                                    }

                                }
                            } else if (order.type == 'sell') {
                                if (bid >= target_price) {
                                    let imr = 1 / order.leverage;
                                    let initialMargin = order.amount * ask * imr;
                                    if (balance >= initialMargin) {
                                        console.log("sell margin start");
                                        order.initialMargin = initialMargin;
                                        order.method = 'market';
                                        userBalance.amount = parseFloat(userBalance.amount) - initialMargin;
                                        order.open_time = Date.now();
                                        order.open_price = ask;
                                        order.status = 1;
                                        await order.save();
                                        await userBalance.save();
                                    } else {
                                        order.close_time = Date.now();
                                        order.status = -1;
                                        await order.save();
                                    }

                                }
                            }

                            if (order.type == 'sell') {
                                if (bid >= target_price) {
                                    order.method = 'market';
                                    order.open_time = Date.now();
                                    order.open_price = bid;
                                    await order.save();
                                }
                            }
                        }

                        if (order.method == 'stop_limit') {
                            let ask = parseFloat(list[i].a);
                            let bid = parseFloat(list[i].b);
                            let target_price = parseFloat(order.target_price) ?? 0.0;
                            let imr = 1 / order.leverage;
                            let initialMargin = order.amount * price * imr;
                            if (order.margin_type == 'cross')
                                balance = (userBalance.amount * 1.0).toFixed(2);
                            else if (order.margin_type == 'isolated')
                                balance = order.isolated;

                            if (order.type == 'buy') {
                                if (ask >= target_price) {
                                    order.method = 'market';
                                    order.open_time = Date.now();
                                    order.open_price = ask;
                                    order.margin = initialMargin;
                                    await order.save();
                                }
                            }

                            if (order.type == 'sell') {
                                if (bid <= target_price) {
                                    order.method = 'market';
                                    order.open_time = Date.now();
                                    order.margin = initialMargin;
                                    order.open_price = bid;
                                    await order.save();
                                }
                            }
                        }
                        if (order.method == 'market') {

                            if (order.margin_type == 'cross')
                                balance = (userBalance.amount * 1.0).toFixed(2);
                            else if (order.margin_type == 'isolated')
                                balance = order.isolated;
                            let price = parseFloat(list[i].a);
                            let imr = 1 / order.leverage;
                            let initialMargin = order.amount * price * imr;
                            //console.log(price + " | " + open_price + " | " + imr + " | " +  initialMargin + " | " + " | " + pnl + " | " + roe + " | " + balance);

                            let pnl = (price - parseFloat(order.open_price)) * parseFloat(order.amount) * imr;

                            if (order.type == 'buy') {

                                let roe = ((pnl / initialMargin) * (1 - order.open_price / price)) / imr;
                                console.log(roe);
                                //let pl = (((open_price - price) *  order.amount) * parseInt(order.leverage)).toFixed(2);
                                order.pnl = pnl;
                                totalPNL += pnl;
                                let tp = order.tp ?? 0.00;
                                let sl = order.sl ?? 0.00;
                                if (balance <= 0) {
                                    order.status = 1;
                                    userBalance.amount = 0;
                                    order.close_price = price;
                                    order.close_time = Date.now();
                                    order.pnl = pnl;
                                    await order.save();
                                    await userBalance.save();
                                } else {
                                    if (tp != 0) {
                                        if (price >= tp) {
                                            userBalance.amount = parseFloat(userBalance.amount) + balance;
                                            order.close_price = price;
                                            order.close_time = Date.now();
                                            order.status = 1;
                                            order.pnl = pnl;
                                            await order.save();
                                            await userBalance.save();
                                        }

                                    }
                                    if (sl != 0) {
                                        if (price <= sl) {
                                            userBalance.amount = parseFloat(userBalance.amount) - balance;
                                            order.close_price = price;
                                            order.close_time = Date.now();
                                            order.status = 1;
                                            order.pnl = pnl;
                                            await order.save();
                                            await userBalance.save();
                                        }
                                    }
                                    console.log("Order : " + order._id + " | Fiyat : " + price + " | Miktar : " + order.amount + " | Leverage : (" + order.leverage + ") " + " | PL : " + pnl + " | Balance : " + balance);


                                }


                            } else if (order.type == 'sell') {
                                let roe = ((pnl / initialMargin) * (1 - price / order.open_price)) / imr;
                                order.pnl = pnl;
                                totalPNL += pnl;
                                let tp = order.tp ?? 0.00;
                                let sl = order.sl ?? 0.00;
                                if (balance <= 0) {
                                    order.status = 1;
                                    userBalance.amount = 0;
                                    order.close_price = price;
                                    order.close_time = Date.now();
                                    order.pnl = pnl;
                                    await order.save();
                                    await userBalance.save();
                                } else {
                                    if (tp != 0) {
                                        if (price >= tp) {
                                            userBalance.amount = parseFloat(userBalance.amount) + pnl;
                                            order.close_price = price;
                                            order.close_time = Date.now();
                                            order.status = 1;
                                            order.pnl = pnl;
                                            await order.save();
                                            await userBalance.save();
                                        }

                                    }
                                    if (sl != 0) {
                                        if (price <= sl) {
                                            userBalance.amount = parseFloat(user.amount) - pnl;
                                            order.close_price = price;
                                            order.close_time = Date.now();
                                            order.status = 1;
                                            order.pnl = pnl;
                                            await order.save();
                                            await userBalance.save();
                                        }
                                    }
                                    console.log("Order : " + order._id + " | Fiyat : " + price + " | Miktar : " + order.amount + " | Leverage : (" + order.leverage + ") " + " | PL : " + pnl + " | Balance : " + balance);

                                }
                            }
                            //console.log("Price : ", price , " | P/L : ", pl, " | User Balance : ", userBalance.amount);

                        }
                    }
                    userBalance.amount += totalPNL;
                    await userBalance.save();
                }

            }
        }

    }
}



initialize();