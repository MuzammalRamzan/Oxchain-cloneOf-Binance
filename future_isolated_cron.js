require("dotenv").config();
const WebSocket = require("ws");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
const Connection = require("./Connection");
const Orders = require("./models/Orders.js");
const UserRef = require("./models/UserRef.js");
const User = require("./models/User.js");
const FutureOrder = require("./models/FutureOrder");
const FutureWalletModel = require("./models/FutureWalletModel");
const { default: axios } = require("axios");
var mongodbPass = process.env.MONGO_DB_PASS;

const io = new Server();

const FutureWalletId = "62ff3c742bebf06a81be98fd";
async function initialize() {
  await Connection.connection();

  let request = {};
  let orders = await FutureOrder.find(request).exec();

  let isInsert = FutureOrder.watch([
    { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
  ]).on("change", async (data) => {
    //orders = data;
    orders = await FutureOrder.find(request).exec();
    await Run(orders);
  });
  await Run(orders);

}
async function Run(orders) {
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
          future_type: 'isolated'
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
      if(order.status == 0) continue;
      let item = await axios("http://18.130.193.166:8542/price?symbol=" + order.pair_name.replace("/",""));
      if (item != null && item != '') {
        let price = item.data.data.ask;
        if (order.stop_limit != 0) {
          if (order.type == 'buy') {
            if (price >= order.target_price) {

              order.status = 0;
              await order.save();
              let n_order = new FutureOrder({
                pair_id: order.pair_id,
                pair_name: order.pair_name,
                type: order.type,
                future_type: order.future_type,
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
              let n_order = new FutureOrder({
                pair_id: order.pair_id,
                pair_name: order.pair_name,
                type: order.type,
                future_type: order.future_type,
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

          let reverseOreders = await FutureOrder.findOne({
            user_id: order.user_id,
            pair_id: order.pair_id,
            future_type: order.future_type,
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
              order.status = 0;
              await order.save();

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
                userBalance.amount = userBalance.amount + reverseOreders.usedUSDT + order.usedUSDT;
                await userBalance.save();
                await reverseOreders.save();
                order.status = 0;
                await order.save();
              } else {
                let ilkIslem = reverseOreders.usedUSDT;
                let tersIslem = order.usedUSDT;
                let data = ilkIslem - tersIslem;
                userBalance = await FutureWalletModel.findOne({
                  coin_id: FutureWalletId,
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
                order.status = 0;
                await order.save();
              }
            }
          } else {


            userBalance = await FutureWalletModel.findOne({
              coin_id: FutureWalletId,
              user_id: order.user_id,
            }).exec();
            /*
            userBalance.amount = userBalance.amount - order.usedUSDT;
            await userBalance.save();
            */
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
              target_price: order.target_price,
              leverage: order.leverage,
              amount: order.amount,
              open_price: price,
            });
            await n_order.save();
            order.status = 0;
            await order.save();
          }


        }
      }
    }
    else if (order.method == 'stop_limit') {
      let item = await axios("http://18.130.193.166:8542/price?symbol=" + order.pair_name.replace("/",""));
      if (item != null && item != '') {
        let price = item.data.data.ask;
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


  let totalPNL = 0.0;
  console.log(orders.length);
  for (var n = 0; n < orders.length; n++) {
    if(orders.method != 'market') continue;
    if(orders.status != 0) continue;
    let pnl = 0;
    

    let order = orders[n];
    let getPrice = await axios("http://18.130.193.166:8542/price?symbol=" + order.pair_name.replace("/",""));
    let price = getPrice.data.data.ask;
    if (order.type == "buy") {
      let liqPrice = (order.open_price - (order.open_price / (order.leverage * 1.0)));
      pnl = (price - order.open_price) * order.amount;
      let reverseUsedUSDT = order.usedUSDT * -1;
      if (order.open_price <= liqPrice) {
        order.status = 1;
      }
      if (pnl <= reverseUsedUSDT) {
        order.status = 1;
      }
    } else {
      let reverseUsedUSDT = order.usedUSDT;
      pnl = (order.open_price - price) * order.amount;
      let liqPrice = (order.open_price + (order.open_price / (order.leverage * 1.0)));
      if (order.open_price >= liqPrice) {
        order.status = 1;
      }
      if (pnl <= reverseUsedUSDT) {
        order.status = 1;
      }

    }
    
    order.pnl = pnl;
    await order.save();



  }
}

initialize();
