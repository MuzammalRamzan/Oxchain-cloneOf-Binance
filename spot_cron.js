const { createHash } = require("crypto");
const mongoose = require("mongoose");
const WebSocket = require('ws');
const Orders = require("./models/Orders");
const Pairs = require("./models/Pairs");
const Wallet = require("./models/Wallet");
require("dotenv").config();

async function main() {
    var mongodbPass = process.env.MONGO_DB_PASS;

    var connection =
        "mongodb+srv://volkansaka:" +
        mongodbPass +
        "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority";
    await mongoose.connect(connection);


    let request = { $or: [{ type: "limit" }, { type: "stop_limit" }] };
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
                            if (order.method == 'buy') {
                                let price = parseFloat(list[i].a);
                                console.log(order.target_price + "  | "  + price);
                                if (price <= target_price) {
                                    await Orders.updateOne({ _id: order._id }, { $set: { type: 'market', open_price: Date.now, open_price: price } });
                                    let getPair = await Pairs.findOne({symbolOneID : order.pair_id}).exec();
                                    let toWallet = Wallet.findOne({coin_id : getPair.symbolTwoID, user_id:order.user_id}).exec()
                                    toWallet.amount = parseFloat(toWallet.amount) + parseFloat(order.amount);
                                }
                            }
                            if (order.method == 'sell') {
                                let price = parseFloat(list[i].b);
                                if (price >= target_price) {
                                    await Orders.updateOne({ _id: order._id }, { $set: { type: 'market', open_price: Date.now, open_price: price } });
                                }
                            }
                        } else if(order.type == 'stop_limit') {
                            if (order.method == 'buy') {
                                let price = parseFloat(list[i].a);
                                if (price >= target_price) {
                                    await Orders.updateOne({ _id: order._id }, { $set: { type: 'market', open_price: Date.now, open_price: price } });
                                }
                            }
                            if (order.method == 'sell') {
                                let price = parseFloat(list[i].b);
                                if (price <= target_price) {
                                    await Orders.updateOne({ _id: order._id }, { $set: { type: 'market', open_price: Date.now, open_price: price } });
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