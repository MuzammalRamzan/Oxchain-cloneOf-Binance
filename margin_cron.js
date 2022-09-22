require("dotenv").config();
const WebSocket = require("ws");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
const MarginOrder = require("./models/MarginOrder.js");
const Connection = require("./Connection");
const Wallet = require("./models/Wallet.js");
const Orders = require("./models/Orders.js");
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
      let totalPNL = 0.0;

      let getOpenOrders = await MarginOrder.aggregate([
        {
          $match: { status: 0, method: "market", margin_type: "cross" },
        },

        {
          $group: {
            _id: "$user_id",
          },
        },
      ]);
      for (var n = 0; n < getOpenOrders.length; n++) {
        let wallet = await Wallet.findOne({
          user_id: getOpenOrders[n]._id,
          coin_id: MarginWalletId,
        }).exec();
        wallet.pnl = getOpenOrders[n].total;
        totalPNL = totalPNL + parseFloat(getOpenOrders[n].total);
        await wallet.save();
      }

      /*
            let getOpenOrders = await MarginOrder.find({ method: 'market', status: 0 }).exec();
            for (var n = 0; n < getOpenOrders.length; n++) {
                console.log("TOTAL PNL : ", totalPNL);
                
                
                wallet.pnl = 
                new Promise(function (resolve) {
                    wallet.save();
                });
            }
            */
      for (var i = 0; i < list.length; i++) {
        let symbol = list[i].s.replace("/", "");
        for (var k = 0; k < orders.length; k++) {
          let order = orders[k];
          let userBalance = await Wallet.findOne({
            user_id: order.user_id,
            coin_id: MarginWalletId,
          }).exec();
          console.log(userBalance);
          let balance =
            parseFloat(userBalance.amount) +
            totalPNL +
            parseFloat(order.usedUSDT);
          if (balance <= 0 && userBalance.pnl != 0) {
            userBalance.pnl = 0;
            userBalance.amount = 0;
            await userBalance.save();
            await MarginOrder.updateMany(
              { user_id: order.user_id, margin_type: "cross" },
              { $set: { status: 1 } }
            ).exec();
            return;
          }
          if (order.pair_name.replace("/", "") == symbol) {
            if (order.method == "limit") {
              if (order.status != 1) {
                continue;
              }
              let ask = parseFloat(list[i].a);
              let bid = parseFloat(list[i].b);
              let target_price = parseFloat(order.target_price) ?? 0.0;
              console.log(target_price + " | " + ask + " | ");
              /*
                            if (order.margin_type == 'cross')
                                balance = (userBalance.amount * 1.0).toFixed(2);
                            else if (order.margin_type == 'isolated')
                                balance = order.isolated;
*/

              if (order.type == "buy") {
                if (ask <= target_price) {
                  let imr = 1 / order.leverage;
                  let initialMargin = order.amount * ask;
                  console.log("initial margin : ", initialMargin);
                  if (balance >= initialMargin) {
                    console.log("buy margin start");
                    order.initialMargin = initialMargin;
                    order.method = "market";
                    userBalance.amount =
                      parseFloat(userBalance.amount) - initialMargin;
                    order.open_time = Date.now();
                    order.open_price = ask;
                    order.status = 0;
                    await order.save();
                    await userBalance.save();
                  } else {
                    order.close_time = Date.now();
                    order.status = -3;
                    await order.save();
                  }
                }
              } else if (order.type == "sell") {
                if (bid >= target_price) {
                  let imr = 1 / order.leverage;
                  let initialMargin = order.amount * ask;
                  if (balance >= initialMargin) {
                    console.log("sell margin start");
                    order.initialMargin = initialMargin;
                    order.method = "market";
                    userBalance.amount =
                      parseFloat(userBalance.amount) - initialMargin;
                    order.open_time = Date.now();
                    order.open_price = ask;
                    order.status = 0;
                    await order.save();
                    await userBalance.save();
                  } else {
                    order.close_time = Date.now();
                    order.status = -3;
                    await order.save();
                  }
                }
              }
              /*
                                                        if (order.type == 'sell') {
                                                            if (bid >= target_price) {
                                                                order.method = 'market';
                                                                order.open_time = Date.now();
                                                                order.open_price = bid;
                                                                await order.save();
                                                            }
                                                        }
                                                        */
            }

            if (order.method == "stop_limit") {
              if (order.status != 1) {
                continue;
              }
              let ask = parseFloat(list[i].a);
              let bid = parseFloat(list[i].b);
              let target_price = parseFloat(order.target_price) ?? 0.0;
              console.log(target_price + " | " + ask + " | ");
              /*
                            if (order.margin_type == 'cross')
                                balance = (userBalance.amount * 1.0).toFixed(2);
                            else if (order.margin_type == 'isolated')
                                balance = order.isolated;
*/
              if (order.type == "buy") {
                if (ask <= target_price) {
                  let imr = 1 / order.leverage;
                  let initialMargin = order.amount * ask;
                  if (balance >= initialMargin) {
                    console.log("buy margin start");
                    order.initialMargin = initialMargin;
                    order.method = "market";
                    userBalance.amount =
                      parseFloat(userBalance.amount) - initialMargin;
                    order.open_time = Date.now();
                    order.open_price = order.stop_limit;
                    order.status = 1;
                    await order.save();
                    await userBalance.save();
                  } else {
                    order.close_time = Date.now();
                    order.status = -1;
                    await order.save();
                  }
                }
              } else if (order.type == "sell") {
                if (bid >= target_price) {
                  let imr = 1 / order.leverage;
                  let initialMargin = order.amount * ask;
                  if (balance >= initialMargin) {
                    console.log("sell margin start");
                    order.initialMargin = initialMargin;
                    order.method = "market";
                    userBalance.amount =
                      parseFloat(userBalance.amount) - initialMargin;
                    order.open_time = Date.now();
                    order.open_price = order.stop_limit;
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
              /*
                                                        if (order.type == 'sell') {
                                                            if (bid >= target_price) {
                                                                order.method = 'market';
                                                                order.open_time = Date.now();
                                                                order.open_price = bid;
                                                                await order.save();
                                                            }
                                                        }
                                                        */
            }

            if (order.method == "market") {
              if (order.status != 0) continue;

              let price = parseFloat(list[i].a);

              let initialMargin = order.amount * price;

              //console.log("Order : " + order._id + " | Fiyat : " + price + " | Miktar : " + order.amount + " | Leverage : (" + order.leverage + ") " + " | PL : " + pnl + " | Balance : " + balance);
              if (order.type == "buy") {
                let pnl =
                  (price - parseFloat(order.open_price)) *
                  parseFloat(order.amount);
                totalPNL += pnl;

                //let pl = (((open_price - price) *  order.amount) * parseInt(order.leverage)).toFixed(2);
                order.pnl = pnl;

                let tp = order.tp ?? 0.0;
                let sl = order.sl ?? 0.0;
                if (balance <= 0) {
                  console.log(
                    "PNL : " +
                      pnl +
                      " | Balance : " +
                      balance +
                      " | UserBalance Amount: " +
                      userBalance.amount
                  );
                  order.status = -2;
                  userBalance.amount = 0;
                  userBalance.pnl = 0;
                  order.close_price = price;
                  order.close_time = Date.now();
                  order.pnl = pnl;
                  orders[k] = order;
                  await userBalance.save();
                } else {
                  if (tp != 0) {
                    if (price >= tp) {
                      userBalance.amount =
                        parseFloat(userBalance.amount) + balance;
                      order.close_price = price;
                      order.close_time = Date.now();
                      order.status = 1;
                      order.pnl = pnl;
                      orders[k] = order;
                      await userBalance.save();
                    }
                  }
                  if (sl != 0) {
                    if (price <= sl) {
                      userBalance.amount =
                        parseFloat(userBalance.amount) - balance;
                      order.close_price = price;
                      order.close_time = Date.now();
                      order.status = 1;
                      order.pnl = pnl;
                      orders[k] = order;
                      await userBalance.save();
                    }
                  }
                }
                order.pnl = pnl;
                order
                  .save()
                  .then(() => {})
                  .catch((err) => {});
              } else if (order.type == "sell") {
                let pnl =
                  (parseFloat(order.open_price) - price) *
                  parseFloat(order.amount);
                totalPNL += pnl;
                order.pnl = pnl;
                let tp = order.tp ?? 0.0;
                let sl = order.sl ?? 0.0;
                if (balance <= 0) {
                  order.status = -2;
                  userBalance.amount = 0;
                  userBalance.pnl = 0;
                  order.close_price = price;
                  order.close_time = Date.now();
                  order.pnl = pnl;
                  orders[k] = order;
                  await userBalance.save();
                } else {
                  if (tp != 0) {
                    if (price >= tp) {
                      userBalance.amount = parseFloat(userBalance.amount) + pnl;
                      order.close_price = price;
                      order.close_time = Date.now();
                      order.status = 1;
                      order.pnl = pnl;
                      orders[k] = order;
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
                      orders[k] = order;
                      await userBalance.save();
                    }
                  }
                }
                order.pnl = pnl;
                order
                  .save()
                  .then(() => {})
                  .catch((err) => {});
              }
              //console.log("Price : ", price , " | P/L : ", pl, " | User Balance : ", userBalance.amount);
            }
          }
        }
      }

      //FILL WALLET
    };
  };
}

initialize();
