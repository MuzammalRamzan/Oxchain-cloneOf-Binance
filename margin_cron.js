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

    let orders = await MarginOrder.find({ status: 0 }).exec();


    let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
        //orders = data;
        orders = await MarginOrder.find({ status: 0 }).exec();

    });
    let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
        orders = await MarginOrder.find({ status: 0 }).exec();
    });
    let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
        console.log("silindi");
        orders = await MarginOrder.find({ status: 0 }).exec();
    });

    let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
        console.log("silindi 2");
        orders = await MarginOrder.find({ status: 0 }).exec();

    });



    const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    allTickers.onopen = () => {
        allTickers.onmessage = async (data) => {
            let list = JSON.parse(data.data);
            for (var i = 0; i < list.length; i++) {
                let symbol = list[i].s.replace("/", "");
                for (var k = 0; k < orders.length; k++) {
                    let order = orders[k];
                    if (order.pair_name.replace('/', '') == symbol) {
                        let userBalance = await Wallet.findOne({ user_id: order.user_id, coin_id: MarginWalletId });
                        let balance = 0.00;
                        if (order.margin_type == 'cross')
                            balance = (userBalance.amount * 1.0).toFixed(2);
                        else if (order.margin_type == 'isolated')
                            balance = order.isolated;
                        let price = parseFloat(list[i].a);
                        let open_price = parseFloat(order.open_price).toFixed(2);
                        let imr = 1 / order.leverage;
                        let initialMargin = order.amount * price * imr;
                        //console.log(price + " | " + open_price + " | " + imr + " | " +  initialMargin + " | " + " | " + pnl + " | " + roe + " | " + balance);

                        if (order.type == 'buy') {
                            let pnl = (price - order.open_price) * order.amount;
                            let roe = ((pnl / initialMargin) * (1 - order.open_price / price)) / imr;

                            //let pl = (((open_price - price) *  order.amount) * parseInt(order.leverage)).toFixed(2);

                            balance = parseFloat(balance) + parseFloat(pnl) * 1.0;
                            let tp = order.tp ?? 0.00;
                            let sl = order.sl ?? 0.00;
                            if (balance <= 0) {
                                order.status = 1;
                                userBalance.amount = 0;
                                order.close_price = price;
                                order.close_time = Date.now();
                                await order.save();
                                await userBalance.save();
                            } else {
                                if (tp != 0) {
                                    if (price >= tp) {
                                        userBalance.amount = balance;
                                        order.close_price = price;
                                        order.close_time = Date.now();
                                        order.status = 1;
                                        await order.save();
                                        await userBalance.save();
                                    }

                                }
                                if (sl != 0) {
                                    if (price <= sl) {
                                        userBalance.amount = balance;
                                        order.close_price = price;
                                        order.close_time = Date.now();
                                        order.status = 1;
                                        await order.save();
                                        await userBalance.save();
                                    }
                                }
                                console.log("Order : " + order._id + " | Fiyat : " + price + " | Miktar : " + order.amount + " | Leverage : (" + order.leverage + ") " + " | PL : " + pnl + " | Balance : " + balance);

                                userBalance.amount = balance;
                                await userBalance.save();
                            }


                        } else if (order.type == 'sell') {
                            let pnl = (order.open_price - price) * order.amount;
                            balance = parseFloat(balance) + parseFloat(pnl) * 1.0;
                            let tp = order.tp ?? 0.00;
                            let sl = order.sl ?? 0.00;
                            if (balance <= 0) {
                                order.status = 1;
                                userBalance.amount = 0;
                                order.close_price = price;
                                order.close_time = Date.now();
                                await order.save();
                                await userBalance.save();
                            } else {
                                if (tp != 0) {
                                    if (price >= tp) {
                                        userBalance.amount = balance;
                                        order.close_price = price;
                                        order.close_time = Date.now();
                                        order.status = 1;
                                        await order.save();
                                        await userBalance.save();
                                    }

                                }
                                if (sl != 0) {
                                    if (price <= sl) {
                                        userBalance.amount = balance;
                                        order.close_price = price;
                                        order.close_time = Date.now();
                                        order.status = 1;
                                        await order.save();
                                        await userBalance.save();
                                    }
                                }
                                console.log("Order : " + order._id + " | Fiyat : " + price + " | Miktar : " + order.amount + " | Leverage : (" + order.leverage + ") " + " | PL : " + pnl + " | Balance : " + balance);

                                userBalance.amount = balance;
                                await userBalance.save();
                            }
                        }
                        //console.log("Price : ", price , " | P/L : ", pl, " | User Balance : ", userBalance.amount);
                        ;
                    }
                }
            }
        }

    }
}



initialize();