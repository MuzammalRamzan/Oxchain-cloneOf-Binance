require("dotenv").config();
const WebSocket = require("ws");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
const FutureOrder = require("./models/FutureOrder.js");
const Connection = require("./Connection");
const FutureWalletModel = require("./models/FutureWalletModel.js");
const { default: axios } = require("axios");
var mongodbPass = process.env.MONGO_DB_PASS;
const UserNotifications = require("./models/UserNotifications");
const SiteNotificaitonModel = require("./models/SiteNotifications");
const User = require("./models/User");
const mailer = require("./mailer");
var mongoose = require('mongoose')

const io = new Server();

const FutureWalletId = "62ff3c742bebf06a81be98fd";

async function Start() {


    /*
      let req = await axios('http://global.oxhain.com:8542/future_all_price');
      let priceData = req.data;
      await Run(priceData.data);
      await Start()
    */
      const oxhainMain = mongoose.createConnection("mongodb://" + process.env.DOCUMENT_DB_UID + ":" + process.env.DOCUMENT_DB_PASS + "@" + process.env.DBIP + "/?retryWrites=true&w=majority")
      const oxhainMarket = mongoose.createConnection("mongodb://" + process.env.MARKET_DB_UID + ":" + process.env.MARKET_DB_PASS + "@" + process.env.MARKETDBIP + "/?retryWrites=true&w=majority")
  
    var Schema = new mongoose.Schema({})
    let quoteModel = oxhainMarket.model('FutureQuoteModel', Schema)
    let ordersModel = oxhainMain.model('FutureOrder', Schema);

    quoteModel.watch([
        {
            $match : {
                operationType : {
                    $in : ['update']
                }
            }
        }
    ]).on('change', async data => {
        let relevantData = await quoteModel.findOne({_id : data.documentKey._id});
        await checkLimitOrder(relevantData);
    });


    /*
  while (true) {
    let req = await axios('http://global.oxhain.com:8542/future_all_price');
    let priceData = req.data;
    await Run(priceData.data);
  }
  */
    /*
      
    */
    /*
      await Run(data.content);
      await init();
      */
}

async function checkLimitOrder(quoteInfo) {
    console.log(quoteInfo);
    let symbolName = quoteInfo.symbol;
    console.log(symbolName);
        return;
    let limitOrders = await FutureOrder.find(
        {
            $and: [
                {
                    $or: [
                        { method: 'limit' },
                        { method: 'stop_limit' },
                    ]
                },
                {
                    pair_name: quoteInfo.symbol.replace('USDT', '/USDT') ,
                },
                {
                    status: 1
                }
            ]
        }
    );

    console.log(limitOrders);
}

async function init() {
    //await Connection.connection();
    
    await Start();
}
init();

async function initialize() {

    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
    await Connection.connection();
    var b_ws = new WebSocket("wss://global.oxhain.com:7010");
    b_ws.onopen = (event) => {
        b_ws.send(JSON.stringify({ page: "future_all_prices" }));
    };

    // Reconnect connection when disconnect connection
    b_ws.onclose = () => {
        //b_ws.send(JSON.stringify(initSocketMessage));
    };
    b_ws.onmessage = async function (event) {
        const data = JSON.parse(event.data);
        if (data != null && data != "undefined") {
            await Run(data.content);
            //sleep(2000);
        }
    };


    //setInterval()

    /*
    const oxhainMain = mongoose.createConnection("mongodb://" +
    process.env.DOCUMENT_DB_UID
    + ":" +
    process.env.DOCUMENT_DB_PASS
    + "@" + process.env.DBIP + "/?retryWrites=true&w=majority")
  
  
  
    const oxhainGlobal = mongoose.createConnection("mongodb://" +
    process.env.MARKET_DB_UID
    + ":" +
    process.env.MARKET_DB_PASS
    + "@" + process.env.MARKETDBIP + "/?retryWrites=true&w=majority")
  
    setInterval(async function () {
      let orders = await FutureOrder.find(request).exec();
      await Run(orders);
    }, 3000);
  
    */
    /*
    let isInsert = FutureOrder.watch([
      { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
    ]).on("change", async (data) => {
      //orders = data;
      orders = await FutureOrder.find(request).exec();
      await Run(orders);
    });
    */



}
async function Run(priceList) {
    //if (priceList == null || priceList.length == 0) return;
    let limitOrders = await FutureOrder.find(
        {
            $and: [
                {
                    $or: [
                        { method: 'limit' },
                        { method: 'stop_limit' },
                    ]
                },
                {
                    future_type: 'cross'
                },
                {
                    status: 1
                }
            ]
        }
    );

    for (var i = 0; i < limitOrders.length; i++) {
        var order = limitOrders[i];

        if (order.method == 'limit') {
            if (order.status == 0) continue;

            let item = priceList.find(x => x.symbol == order.pair_name.replace('/', ''));
            if (item != null && item != '') {
                let price = item.ask;
                if (order.type == 'buy') {
                    if (price >= order.target_price) {
                        continue;
                    }
                } else if (order.type == 'sell') {
                    if (price <= order.target_price) {
                        continue;
                    }
                }
                let reverseOreders = await FutureOrder.findOne({
                    user_id: order.user_id,
                    pair_id: order.pair_id,
                    future_type: order.future_type,
                    method: 'market',
                    status: 0,
                });

                if (reverseOreders) {

                    if (reverseOreders.type == order.type) {
                        let oldAmount = reverseOreders.amount;
                        let oldUsedUSDT = reverseOreders.usedUSDT;
                        let oldPNL = splitLengthNumber(reverseOreders.pnl);
                        let oldLeverage = reverseOreders.leverage;
                        let newUsedUSDT = oldUsedUSDT + order.usedUSDT + oldPNL;

                        reverseOreders.usedUSDT = newUsedUSDT;
                        reverseOreders.open_price = price;
                        reverseOreders.pnl = 0;
                        reverseOreders.leverage = order.leverage;
                        reverseOreders.open_time = Date.now();
                        reverseOreders.amount = (newUsedUSDT * order.leverage) / price;

                        await reverseOreders.save();
                        order.status = 0;
                        await order.save();
                        continue;
                    } else {
                        //Tersine ise
                        let checkusdt = (reverseOreders.usedUSDT + reverseOreders.pnl) * reverseOreders.leverage;
                        if (checkusdt == order.usedUSDT * order.leverage) {
                            reverseOreders.status = 1;

                            let userBalance = await FutureWalletModel.findOne({
                                coin_id: FutureWalletId,
                                user_id: req.body.user_id,
                            }).exec();
                            userBalance.amount =
                                userBalance.amount +
                                reverseOreders.pnl +
                                reverseOreders.usedUSDT;
                            await userBalance.save();
                            await reverseOreders.save();
                            order.status = 0;
                            await order.save();
                            continue;
                        }

                        else if (checkusdt > order.usedUSDT * order.leverage) {
                            let writeUsedUSDT =
                                reverseOreders.usedUSDT + reverseOreders.pnl - order.usedUSDT;

                            if (writeUsedUSDT < 0) writeUsedUSDT *= -1;


                            reverseOreders.usedUSDT = writeUsedUSDT;
                            reverseOreders.amount =
                                (writeUsedUSDT * reverseOreders.leverage) / price;
                            let userBalance = await FutureWalletModel.findOne({
                                coin_id: FutureWalletId,
                                user_id: order.user_id,
                            }).exec();



                            userBalance.amount = userBalance.amount + (order.usedUSDT * 2);
                            await userBalance.save();
                            await reverseOreders.save();
                            order.status = 0;
                            await order.save();
                            continue;

                        } else {
                            let ilkIslem = reverseOreders.usedUSDT;
                            let tersIslem = order.usedUSDT;
                            let data = tersIslem - ilkIslem;
                            if (data < 0) data *= -1;
                            userBalance = await FutureWalletModel.findOne({
                                coin_id: FutureWalletId,
                                user_id: order.user_id,
                            }).exec();
                            userBalance.amount = userBalance.amount - (data * 2) + (tersIslem * 2);
                            await userBalance.save();

                            reverseOreders.type = order.type;
                            reverseOreders.leverage = order.leverage;
                            let writeUsedUSDT =
                                reverseOreders.usedUSDT + reverseOreders.pnl - order.usedUSDT;
                            if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                            reverseOreders.usedUSDT = writeUsedUSDT;
                            //reverseOreders.amount = ((((reverseOreders.usedUSDT + reverseOreders.pnl) * leverage) - (usedUSDT * leverage)) / price);
                            reverseOreders.amount = (writeUsedUSDT * order.leverage) / price;
                            await reverseOreders.save();
                            order.status = 0;
                            await order.save();
                            continue;
                        }
                    }
                } else {


                    let checkFillOrder = await FutureOrder.findOne({ limit_id: order._id, method: 'market' });
                    if (checkFillOrder != null) {
                        console.log("Order var cross");
                        continue;
                    }

                    userBalance = await FutureWalletModel.findOne({
                        coin_id: FutureWalletId,
                        user_id: order.user_id,
                    }).exec();

                    let n_order = new FutureOrder({
                        pair_id: order.pair_id,
                        pair_name: order.pair_name,
                        //type: order.type == 'buy' ? 'sell' : 'buy',
                        type: order.type,
                        future_type: order.future_type,
                        method: 'market',
                        user_id: order.user_id,
                        usedUSDT: order.usedUSDT,
                        required_margin: order.usedUSDT,
                        isolated: order.usedUSDT,
                        sl: order.sl,
                        tp: order.tp,
                        limit_id: order._id,
                        target_price: order.target_price,
                        leverage: order.leverage,
                        amount: order.amount,
                        open_price: order.target_price,
                    });
                    await n_order.save();
                    order.status = 0;
                    await order.save();
                    continue;
                }
            }
        }
        else if (order.method == 'stop_limit') {
            //let item = list.find(x => x.s == order.pair_name.replace('/', ''));
            let item = priceList.find(x => x.symbol == order.pair_name.replace('/', ''));
            if (item != null && item != '') {
                let price = parseFloat(item.ask);
                if (order.type == 'buy') {
                    if (price <= order.stop_limit) {
                        order.method = 'limit';
                        await order.save();
                    }
                } else if (order.type == 'sell') {
                    if (price >= order.stop_limit) {
                        order.method = 'limit';
                        await order.save();
                    }
                }
            }
        }
    }



    let getOpenOrders = await FutureOrder.aggregate([
        {
            $match: { status: 0, method: "market", future_type: "cross" },
        },

        {
            $group: {
                _id: "$user_id",
                total: { $sum: "$pnl" },
                usedUSDT: { $sum: "$usedUSDT" },
            },
        },
    ]);
    let totalPNL = 0.0;
    for (var i = 0; i < getOpenOrders.length; i++) {

        let data = getOpenOrders[i];
        let total = splitLengthNumber(splitLengthNumber(parseFloat(data.total))) + splitLengthNumber(parseFloat(data.usedUSDT));


        let wallet = await FutureWalletModel.findOne({
            user_id: data._id,
            coin_id: FutureWalletId,
        }).exec();
        let marginWalletAmount = wallet.amount;

        //buraya isoleden gelen aktif emirlerin ana yatırma bakiyesini eklemeliyiz çünkü bütün margin wallet bakiyesini değiştiriyor bu fonksiyon

        wallet.pnl = splitLengthNumber(data.total);
        await wallet.save();

        let totalWallet =
            marginWalletAmount + (data.total + data.usedUSDT);

        if (totalWallet <= 0) {
            wallet.pnl = 0;
            wallet.amount = 0;
            await FutureOrder.updateMany({ user_id: data._id, future_type: 'cross', status: 0 }, { $set: { status: 1 } }).exec()
            await FutureOrder.updateMany({ user_id: data._id, future_type: 'cross', method: 'limit' }, { $set: { status: -3 } }).exec()
            await FutureOrder.updateMany({ user_id: data._id, future_type: 'cross', method: 'stop_limit' }, { $set: { status: -3 } }).exec()

        } else {
            wallet.pnl = splitLengthNumber(data.total);
        }
        //
        await wallet.save();

        let userOrders = await FutureOrder.find({ user_id: data._id, method: 'market', future_type: 'cross' }).exec();
        for (var k = 0; k < userOrders.length; k++) {
            let order = userOrders[k];

            if (order.status == 1) continue;
            let findBinanceItem = priceList.filter(x => x.symbol == order.pair_name.replace('/', ''));

            if (findBinanceItem.length == 0) continue;
            //let findBinanceItem = await axios("http://global.oxhain.com:8542/price?symbol=" + order.pair_name.replace("/", ""));

            let item = findBinanceItem[0];
            if (order.type == 'buy') {
                let price = parseFloat(item.ask);
                let pnl = splitLengthNumber((price - order.open_price) * order.amount);
                order.pnl = splitLengthNumber(pnl);
                let tp = parseFloat(order.tp);
                let sl = parseFloat(order.sl);
                if (tp != 0 && price >= tp) {
                    order.status = 1;
                    let w = await FutureWalletModel.findOne({ user_id: order.user_id });
                    let newBalance = parseFloat(w.amount) + (parseFloat(order.usedUSDT) + parseFloat(order.pnl));
                    w.amount = splitLengthNumber(newBalance);

                    await w.save();
                }
                if (sl != 0 && price <= sl) {

                    order.status = 1;
                    let w = await FutureWalletModel.findOne({ user_id: order.user_id });
                    let newBalance = parseFloat(w.amount) + (parseFloat(order.usedUSDT) - parseFloat(order.pnl));
                    w.amount = splitLengthNumber(newBalance);
                    await w.save();
                }
                await order.save();
            } else {
                let price = item.bid;
                let pnl = (order.open_price - price) * order.amount;
                order.pnl = splitLengthNumber(pnl);
                let tp = parseFloat(order.tp);
                let sl = parseFloat(order.sl);
                if (tp != 0 && price <= tp) {
                    order.status = 1;
                    let w = await FutureWalletModel.findOne({ user_id: order.user_id });
                    let newBalance = parseFloat(w.amount) + (parseFloat(order.usedUSDT) + parseFloat(order.pnl));
                    w.amount = splitLengthNumber(newBalance);
                    await w.save();
                }
                if (sl != 0 && price >= sl) {
                    order.status = 1;
                    let w = await FutureWalletModel.findOne({ user_id: order.user_id });
                    let newBalance = parseFloat(w.amount) + (parseFloat(order.usedUSDT) - parseFloat(order.pnl));
                    w.amount = splitLengthNumber(newBalance);
                    await w.save();
                }
                await order.save();
            }


        }
    }

}


function splitLengthNumber(q) {
    return q.toString().length > 4 ? parseFloat(q.toString().substring(0, 4)) : q;
}

//initialize();
