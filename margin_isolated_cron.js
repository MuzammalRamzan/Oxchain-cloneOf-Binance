require("dotenv").config();
const WebSocket = require("ws");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
const MarginOrder = require("./models/MarginOrder.js");
const Connection = require("./Connection");
const Wallet = require("./models/Wallet.js");
const Orders = require("./models/Orders.js");
const UserRef = require("./models/UserRef.js");
const User = require("./models/Test.js");
var mongodbPass = process.env.MONGO_DB_PASS;

const io = new Server();

const MarginWalletId = "62ff3c742bebf06a81be98fd";
async function initialize() {
    await Connection.connection();

    let request = {};
    let orders = await MarginOrder.find(request).exec();

    let isInsert = MarginOrder.watch([
        { $match: { operationType: { $in: ["insert"] } } },
    ]).on("change", async (data) => {
        //orders = data;
        orders = await MarginOrder.find(request).exec();
    });
    let isUpdate = MarginOrder.watch([
        { $match: { operationType: { $in: ["update"] } } },
    ]).on("change", async (data) => {
        orders = await MarginOrder.find(request).exec();
    });
    let isRemove = MarginOrder.watch([
        { $match: { operationType: { $in: ["remove"] } } },
    ]).on("change", async (data) => {
        console.log("silindi");
        orders = await MarginOrder.find(request).exec();
    });

    let isDelete = MarginOrder.watch([
        { $match: { operationType: { $in: ["delete"] } } },
    ]).on("change", async (data) => {
        console.log("silindi 2");
        orders = await MarginOrder.find(request).exec();
    });

    const allTickers = new WebSocket(
        "wss://stream.binance.com:9443/ws/!ticker@arr"
    );
    allTickers.onopen = () => {
        allTickers.onmessage = async (data) => {
            let list = JSON.parse(data.data);

            let limitOrders = await MarginOrder.find(
                {
                    $and: [
                        {
                            $or: [
                                { method: 'limit' },
                                { method: 'stop_limit' },
                            ]
                        },
                        {
                            margin_type: 'isolated'
                        },
                        {
                            status: 1
                        }
                    ]
                }
            );

            for (var i = 0; i < limitOrders.length; i++) {
                let order = limitOrders[i];
                if (order.method == 'limit') {
                    let item = list.find(x => x.s == order.pair_name.replace('/', ''));
                    if (item != null && item != '') {
                        let price = item.a;
                        if (order.type == 'buy') {
                            if (price <= order.target_price) {
                                let wallet = await Wallet.findOne({
                                    user_id: order.user_id,
                                    coin_id: MarginWalletId,
                                }).exec();
                                if (wallet.amount <= order.usedUSDT) {
                                    /*
                                    order.status = -2;
                                    order.close_time = Date.now();
                                    */
                                } else {
                                    wallet.amount = wallet.amount - order.usedUSDT;
                                    await wallet.save();
                                    order.method = 'market';
                                    order.status = 0;
                                    order.open_price = price;
                                }
                                await order.save();
                            }
                        } else if (order.type == 'sell') {
                            if (price >= order.target_price) {
                                let wallet = await Wallet.findOne({
                                    user_id: order.user_id,
                                    coin_id: MarginWalletId,
                                }).exec();
                                if (wallet.amount <= order.usedUSDT) {
                                    /*
                                    order.status = -2;
                                    order.close_time = Date.now();
                                    */
                                } else {
                                    wallet.amount = wallet.amount - order.usedUSDT;
                                    await wallet.save();
                                    order.method = 'market';
                                    order.status = 0;
                                    order.open_price = price;
                                }
                                await order.save();
                            }
                        }
                    }
                }
                else if (order.method == 'stop_limit') {
                    let item = list.find(x => x.s == order.pair_name.replace('/', ''));
                    if (item != null && item != '') {
                        let price = item.a;
                        if (order.type == 'buy') {
                            if (price <= order.target_price) {
                                let wallet = await Wallet.findOne({
                                    user_id: order.user_id,
                                    coin_id: MarginWalletId,
                                }).exec();
                                if (wallet.amount <= order.usedUSDT) {
                                    /*
                                    order.status = -2;
                                    order.close_time = Date.now();
                                    */
                                } else {
                                    wallet.amount = wallet.amount - order.usedUSDT;
                                    await wallet.save();
                                    order.method = 'market';
                                    order.status = 0;
                                    order.open_price = price;
                                }
                                await order.save();
                            }
                        } else if (order.type == 'sell') {
                            if (price >= order.target_price) {
                                let wallet = await Wallet.findOne({
                                    user_id: order.user_id,
                                    coin_id: MarginWalletId,
                                }).exec();
                                if (wallet.amount <= order.usedUSDT) {
                                    /*
                                    order.status = -2;
                                    order.close_time = Date.now();
                                    */
                                } else {
                                    wallet.amount = wallet.amount - order.usedUSDT;
                                    await wallet.save();
                                    order.method = 'market';
                                    order.status = 0;
                                    order.open_price = price;
                                }
                                await order.save();
                            }
                        }
                    }
                }
            }


            let totalPNL = 0.0;
            let orders = await MarginOrder.find({ status: 0, method: "market", margin_type: "isolated" });
            for (var n = 0; n < orders.length; n++) {

                let pnl = 0;
                for (var t = 0; t < list.length; t++) {

                    let order = orders[n];

                    if (order.pair_name.replace("/", "") == list[t].s) {
                        let price = (list[t].a);
                        if (order.type == "buy") {
                            pnl = (price - order.open_price) * order.amount;
                        } else {
                            pnl = (order.open_price - price) * order.amount;
                        }
                        if ((order.usedUSDT + pnl) <= 0) {
                            /*
                            order.status = -2;
                            await order.save();
                            */
                        } else {
                            order.pnl = pnl;
                            await order.save();
                        }

                        console.log(

                            "Type :",
                            order.type,
                            "Price : ",
                            price,
                            " Order Price : ",
                            order.open_price,
                            " PNL : ",
                            pnl,
                            " Amount : ",
                            order.amount
                        );

                    }
                }



            }

            //FILL WALLET
        };
    };
}

initialize();
