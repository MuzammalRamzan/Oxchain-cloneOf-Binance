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
const User = require("./models/User.js");
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
                        if (order.stop_limit != 0) {
                            if (order.type == 'buy') {
                                if (price >= order.target_price) {
                                    
                                    order.status = 0;
                                    await order.save();
                                    let n_order = new MarginOrder({
                                        pair_id: order.pair_id,
                                        pair_name: order.name,
                                        type: order.type,
                                        margin_type: order.margin_type,
                                        method: order.method,
                                        user_id: order.user_id,
                                        usedUSDT: order.usedUSDT,
                                        required_margin: order.usedUSDT,
                                        isolated: order.isolated,
                                        sl: order.sl ?? 0,
                                        tp: order.tp ?? 0,
                                        target_price: order.target_price,
                                        leverage: order.leverage,
                                        amount: order.amount,
                                        open_price: order.target_price,
                                        status: 1,
                                      });
                                      await n_order.save();
                                }
                            } else if (order.type == 'sell') {
                                if (price <= order.target_price) {
                                    
                                    order.status = 0;
                                    await order.save();
                                    let n_order = new MarginOrder({
                                        pair_id: order.pair_id,
                                        pair_name: order.name,
                                        type: order.type,
                                        margin_type: order.margin_type,
                                        method: order.method,
                                        user_id: order.user_id,
                                        usedUSDT: order.usedUSDT,
                                        required_margin: order.usedUSDT,
                                        isolated: order.isolated,
                                        sl: order.sl ?? 0,
                                        tp: order.tp ?? 0,
                                        target_price: order.target_price,
                                        leverage: order.leverage,
                                        amount: order.amount,
                                        open_price: order.target_price,
                                        status: 1,
                                      });
                                      await n_order.save();
                                }
                            }
                        } else {


              if (order.type == 'buy') {
                if (price >= order.target_price) {
                  continue;
                }
              } else if (order.type == 'sell') {
                if (price <= order.target_price) {
                  continue;
                }
              }

              let reverseOreders = await MarginOrder.findOne({
                user_id: order.user_id,
                pair_id: order.pair_id,
                margin_type: order.margin_type,
                method: 'market',
                status: 0,
              });

              if (reverseOreders) {
                console.log("reverse order find");

                if (reverseOreders.type == order.type) {
                  let oldAmount = reverseOreders.amount;
                  let oldUsedUSDT = reverseOreders.usedUSDT;
                  let oldPNL = reverseOreders.pnl;
                  let oldLeverage = reverseOreders.leverage;
                  let newUsedUSDT = oldUsedUSDT + order.usedUSDT + oldPNL;
                  
                  reverseOreders.usedUSDT = newUsedUSDT;
                  reverseOreders.open_price = price;
                  reverseOreders.pnl = 0;
                  reverseOreders.leverage = order.leverage;
                  reverseOreders.open_time = Date.now();
                  reverseOreders.amount = (newUsedUSDT * order.leverage) / price;

                  await reverseOreders.save();
                  await order.remove();

                } else {
                  //Tersine ise
                  let checkusdt = (reverseOreders.usedUSDT + reverseOreders.pnl) * reverseOreders.leverage;
                  if (checkusdt == order.usedUSDT * order.leverage) {
                    reverseOreders.status = 1;
                    let userBalance = await Wallet.findOne({
                      coin_id: MarginWalletId,
                      user_id: req.body.user_id,
                    }).exec();
                    userBalance.amount =
                      userBalance.amount +
                      reverseOreders.pnl +
                      reverseOreders.usedUSDT;
                    await userBalance.save();
                    await reverseOreders.save();
                    await order.remove();
                  }

                  else if (checkusdt > order.usedUSDT * order.leverage) {
                    let writeUsedUSDT =
                      reverseOreders.usedUSDT + reverseOreders.pnl - order.usedUSDT;
                    if (writeUsedUSDT < 0) writeUsedUSDT *= -1;
                    reverseOreders.usedUSDT = writeUsedUSDT;
                    reverseOreders.amount =
                      (writeUsedUSDT * reverseOreders.leverage) / price;
                    let userBalance = await Wallet.findOne({
                      coin_id: MarginWalletId,
                      user_id: order.user_id,
                    }).exec();
                    userBalance.amount = userBalance.amount + reverseOreders.usedUSDT + order.usedUSDT;
                    await userBalance.save();
                    await reverseOreders.save();
                    await order.remove();
                  } else {
                    let ilkIslem = reverseOreders.usedUSDT;
                    let tersIslem = order.usedUSDT;
                    let data = ilkIslem - tersIslem;
                    userBalance = await Wallet.findOne({
                      coin_id: MarginWalletId,
                      user_id: order.user_id,
                    }).exec();
                    userBalance.amount = userBalance.amount + data;
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
                    await order.remove();
                  }
                }
              } else {


                userBalance = await Wallet.findOne({
                  coin_id: MarginWalletId,
                  user_id: order.user_id,
                }).exec();
                /*
                userBalance.amount = userBalance.amount - order.usedUSDT;
                await userBalance.save();
                */
                let n_order = new MarginOrder({
                  pair_id: order.pair_id,
                  pair_name: order.pair_name,
                  //type: order.type == 'buy' ? 'sell' : 'buy',
                  type: order.type,
                  margin_type: order.margin_type,
                  method: 'market',
                  user_id: order.user_id,
                  usedUSDT: order.usedUSDT,
                  required_margin: order.usedUSDT,
                  isolated: order.usedUSDT,
                  sl: order.sl,
                  tp: order.tp,
                  target_price: order.target_price,
                  leverage: order.leverage,
                  amount: order.amount,
                  open_price: price,
                });
                await n_order.save();
                await order.remove();
              }


                        }
                    }
                }
                else if (order.method == 'stop_limit') {
                    let item = list.find(x => x.s == order.pair_name.replace('/', ''));
                    if (item != null && item != '') {
                        let price = item.a;
                        if (order.type == 'buy') {
                            if (price >= order.stop_limit) {
                                order.method = 'limit';
                                await order.save();
                            }
                        } else if (order.type == 'sell') {
                            if (price <= order.stop_limit) {
                                order.method = 'limit';
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
                            let liqPrice = (order.open_price - (order.open_price / (order.leverage * 1.0)));
                            pnl = (price - order.open_price) * order.amount;
                            let reverseUsedUSDT = order.usedUSDT * -1;
                            if (order.open_price <= liqPrice) {
                                order.status = 1;
                            }
                            if(pnl <= reverseUsedUSDT) {
                                order.status = 1;
                            }
                        } else {
                            pnl = (order.open_price - price) * order.amount;
                            let liqPrice = (order.open_price + (order.open_price / (order.leverage * 1.0)));
                            if (order.open_price >= liqPrice) {
                                order.status = 1;
                            }
                            if(pnl <= reverseUsedUSDT) {
                                order.status = 1;
                            }

                        }
                        order.pnl = pnl;
                        await order.save();


                    }
                }



            }

            //FILL WALLET
        };
    };
}

initialize();
