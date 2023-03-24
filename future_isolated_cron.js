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
var mailer = require("./mailer");
const SiteNotificaitonModel = require("./models/SiteNotifications");

const UserNotifications = require("./models/UserNotifications");

const io = new Server();

const FutureWalletId = "62ff3c742bebf06a81be98fd";


async function Start() {

  let req = await axios('http://global.oxhain.com:8542/future_all_price');
  let priceData = req.data;
  let request = { future_type: "isolated", method: "market", status: 0 };
  let orders = await FutureOrder.find(request);
  await Run(orders, priceData.data);
  await Start()
}

async function init() {
  await Connection.connection();
  await Start();
}
init();


async function initialize() {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
  await Connection.connection();

  let request = { future_type: "isolated", method: "market", status: 0 };

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
      let orders = await FutureOrder.find(request);
      await Run(orders, data.content);

    }
  };


}




async function Run(orders, priceList) {
  if (priceList == null) return;
  let limitOrders = await FutureOrder.find({
    $and: [
      {
        $or: [{ method: "limit" }, { method: "stop_limit" }],
      },
      {
        future_type: "isolated",
      },
      {
        status: 1,
      },
    ],
  });

  for (var i = 0; i < limitOrders.length; i++) {

    let order = limitOrders[i];
    if (order.method == "limit") {
      if (order.status == 0) continue;
      let item = priceList.find(x => x.symbol == order.pair_name.replace('/', ''));
      if (item != null && item != "") {
        let price = item.ask;
        if (order.type == "buy") {
          if (price >= order.target_price) {
            continue;
          }
        } else if (order.type == "sell") {
          if (price <= order.target_price) {
            continue;
          }
        }

        let reverseOreders = await FutureOrder.findOne({
          user_id: order.user_id,
          pair_id: order.pair_id,
          future_type: order.future_type,
          method: "market",
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
            let checkusdt =
              (reverseOreders.usedUSDT + reverseOreders.pnl) *
              reverseOreders.leverage;
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
            } else if (checkusdt > order.usedUSDT * order.leverage) {

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
              reverseOreders.amount =
                (writeUsedUSDT * order.leverage) / price;
              await reverseOreders.save();
              order.status = 0;
              await order.save();
              continue;
            }
          }
        } else {

          let checkFillOrder = await FutureOrder.findOne({ limit_id: order._id, method: 'market' });
          if (checkFillOrder != null) {
            console.log("Order var");
            continue;
          }

          userBalance = await FutureWalletModel.findOne({
            coin_id: FutureWalletId,
            user_id: order.user_id,
          }).exec();
          /*
          userBalance.amount = userBalance.amount - order.usedUSDT;
          await userBalance.save();
          */


          const fee = order.usedUSDT * order.leverage * (order.type == 'buy' ? 0.03 : 0.06) / 100.0;

          let orderCoinAmount = (order.usedUSDT - fee) * order.leverage / price;

          let n_order = new FutureOrder({
            pair_id: order.pair_id,
            pair_name: order.pair_name,
            //type: order.type == 'buy' ? 'sell' : 'buy',
            type: order.type,
            future_type: order.future_type,
            method: "market",
            user_id: order.user_id,
            usedUSDT: order.usedUSDT - fee,
            required_margin: order.usedUSDT - fee,
            isolated: order.usedUSDT - fee,
            sl: order.sl,
            tp: order.tp,
            limit_id: order._id,
            target_price: order.target_price,
            leverage: order.leverage,
            amount: orderCoinAmount,
            open_price: price,
            fee: fee,
          });
          await n_order.save();
          order.status = 0;
          await order.save();
          continue;
        }
      }
    } else if (order.method == "stop_limit") {
      let item = priceList.find(x => x.symbol == order.pair_name.replace('/', ''));

      if (item != null && item != "") {

        let price = item.ask;
        if (order.type == "buy") {
          if (price <= order.stop_limit) {
            order.method = "limit";
            await order.save();
          }
        } else if (order.type == "sell") {
          if (price >= order.stop_limit) {
            order.method = "limit";
            await order.save();
          }
        }
      }
    }
  }

  let totalPNL = 0.0;
  for (var n = 0; n < orders.length; n++) {
    if (orders[n].method != "market") continue;
    if (orders[n].status != 0) continue;
    let order = orders[n];
    let pnl = 0;
    let getPrice = priceList.find((x) => x.symbol == order.pair_name.replace('/', ''));
    if (getPrice == null || getPrice.length == 0) continue;
    /*
    let getPrice = await axios(
      "http://global.oxhain.com:8542/price?symbol=" +
      order.pair_name.replace("/", "")
    );
    */
    let price = getPrice.ask;

    if (orders[n].type == "buy") {
      if (order.adjusted != 0) {
        let adjusted = 0;

        if (parseFloat(order.adjusted) > 0) {
          adjusted = order.adjusted;
        } else {
          adjusted = order.adjusted * -1;
        }

        let anaPara = order.usedUSDT;

        let liqHesaplayici = order.open_price / (order.leverage * 1.0);

        let anaParaBoluAdjusted = parseFloat(anaPara) / parseFloat(adjusted);

        let AdjustedLiq =
          (parseFloat(adjusted) * parseFloat(liqHesaplayici)) / anaPara;

        let liqPrice =
          order.open_price -
          (order.usedUSDT) * (order.open_price / (order.leverage * 1.0)) + AdjustedLiq;


        pnl = splitLengthNumber((price - order.open_price) * order.amount);


        let reverseUsedUSDT = order.usedUSDT * -1;

        if (order.open_price <= liqPrice) {
          order.status = 1;
        }
        //if (pnl <= reverseUsedUSDT) {
        //  order.status = 1;
        //}
      } else {
        let liqPrice =
          order.open_price - order.open_price / (order.leverage * 1.0);
        pnl = splitLengthNumber((price - order.open_price) * order.amount);
        let reverseUsedUSDT = order.usedUSDT * -1;

        if (order.open_price <= liqPrice) {

          order.status = 1;
        }
        if (pnl <= reverseUsedUSDT) {

          order.status = 1;
        }
      }
    } else {
      let adjusted = 0;
      if (order.adjusted != 0) {
        if (order.adjusted > 0) {
          adjusted = order.adjusted;
        } else {
          adjusted = order.adjusted * -1;
        }

        let anaPara = order.usedUSDT;

        let liqHesaplayici = order.open_price / (order.leverage * 1.0);

        let anaParaBoluAdjusted = parseFloat(anaPara) / parseFloat(adjusted);

        let AdjustedLiq =
          (parseFloat(adjusted) * parseFloat(liqHesaplayici)) / anaPara;

        let liqPrice =
          order.open_price +
          (order.usedUSDT) * (order.open_price / (order.leverage * 1.0)) + AdjustedLiq;
        pnl = splitLengthNumber((price - order.open_price) * order.amount);
        if (order.open_price >= liqPrice) {
          order.status = 1;
        }
        //if (pnl <= reverseUsedUSDT) {
        //  order.status = 1;
        //}
      } else {
        let reverseUsedUSDT = order.usedUSDT;
        pnl = splitLengthNumber((order.open_price - price) * order.amount);

        if (order.type == 'buy') {
          let liqPrice =
            order.open_price -
            (order.usedUSDT) * (order.open_price / (order.leverage * 1.0));
          if (order.open_price <= liqPrice) {

            let user = await User.findOne({ _id: order.user_id });
            let SiteNotificaitonsCheck = await SiteNotificaitonModel.findOne({ user_id: user._id });


            if (SiteNotificaitonsCheck != null && SiteNotificaitonsCheck != '') {

              if (SiteNotificaitonsCheck.trade == 1) {
                let newNotification = new UserNotifications({
                  user_id: user._id,
                  title: "Margin Liquidated",
                  message: "Your order has been liquidated",
                  read: false
                });

                await newNotification.save();

                if (user.email != null && user.email != '') {
                  mailer.sendMail(user.email, "Margin Liquidated", "Your order has been liquidated");
                }

              }

            }
            order.status = 1;
          }
        } else {
          let liqPrice =
            order.open_price + order.open_price / (order.leverage * 1.0);
          if (order.open_price >= liqPrice) {

            let user = await User.findOne({ _id: order.user_id });
            let SiteNotificaitonsCheck = await SiteNotificaitonModel.findOne({ user_id: user._id });


            if (SiteNotificaitonsCheck != null && SiteNotificaitonsCheck != '') {

              if (SiteNotificaitonsCheck.trade == 1) {
                let newNotification = new UserNotifications({
                  user_id: user._id,
                  title: "Margin Liquidated",
                  message: "Your order has been liquidated",
                  read: false
                });

                await newNotification.save();

                if (user.email != null && user.email != '') {
                  mailer.sendMail(user.email, "Margin Liquidated", "Your order has been liquidated");
                }

              }

            }
            order.status = 1;
          }
        }


        /*
        if (pnl <= reverseUsedUSDT) {
          console.log("reverseUsedUSDT : ", reverseUsedUSDT, " pnl : s", pnl);
          console.log("Bura 7");
          order.status = 1;
        }
        */
      }
    }

    order.pnl = splitLengthNumber(pnl);
    await order.save();
  }
}
function splitLengthNumber(q) {
  return q.toString().length > 4 ? parseFloat(q.toString().substring(0, 4)) : q;
}

//initialize();
