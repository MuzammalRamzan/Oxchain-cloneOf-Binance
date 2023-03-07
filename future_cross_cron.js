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

const io = new Server();

const FutureWalletId = "62ff3c742bebf06a81be98fd";
async function initialize() {
  await Connection.connection();

  let request = { future_type: "cross", method: "market", status: 0 };

  setInterval(async function () {
    let orders = await FutureOrder.find(request).exec();
    await Run(orders);
  }, 1000);
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
      //let item = list.find(x => x.s == order.pair_name.replace('/', ''));
      let item = await axios("http://global.oxhain.com:8542/price?symbol=" + order.pair_name.replace("/", ""));

      if (item != null && item != '') {
        let price = item.data.data.ask;

        if (order.stop_limit != 0) {
          if (order.type == 'buy') {
            if (price <= order.target_price) {

              let user = await User.findOne({ _id: order.user_id });
              let SiteNotificaitonsCheck = await SiteNotificaitonModel.findOne({ user_id: user._id });


              if (SiteNotificaitonsCheck != null && SiteNotificaitonsCheck != '') {

                if (SiteNotificaitonsCheck.trade == 1) {
                  let newNotification = new UserNotifications({
                    user_id: user._id,
                    title: "Order Filled",
                    message: "Your order has been filled",
                    read: false
                  });

                  await newNotification.save();

                  if (user.email != null && user.email != '') {
                    mailer.sendMail(user.email, "Order Filled", "Your order has been filled");
                  }

                }

              }

              const fee = order.usedUSDT * (order.type == 'buy' ? 0.02 : 0.07) / 100.0;
              let totalUsedUSDT = usedUSDT - fee;

              order.fee = fee; 
              order.usedUSDT = totalUsedUSDT;
              order.status = 0;
              await order.save();
              
              let n_order = new FutureOrder({
                pair_id: order.pair_id,
                pair_name: order.pair_name,
                type: order.type,
                future_type: order.future_type,
                method: order.method,
                user_id: order.user_id,
                usedUSDT: order.totalUsedUSDT,
                required_margin: totalUsedUSDT,
                isolated: totalUsedUSDT,
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

              let user = await User.findOne({ _id: order.user_id });
              let SiteNotificaitonsCheck = await SiteNotificaitonModel.findOne({ user_id: user._id });


              if (SiteNotificaitonsCheck != null && SiteNotificaitonsCheck != '') {

                if (SiteNotificaitonsCheck.trade == 1) {
                  let newNotification = new UserNotifications({
                    user_id: user._id,
                    title: "Order Filled",
                    message: "Your order has been filled",
                    read: false
                  });

                  await newNotification.save();

                  if (user.email != null && user.email != '') {
                    mailer.sendMail(user.email, "Order Filled", "Your order has been filled");
                  }

                }

              }
              const fee = order.usedUSDT * (order.type == 'buy' ? 0.02 : 0.07) / 100.0;
              let totalUsedUSDT = usedUSDT - fee;
              order.fee = fee;
              order.usedUSDT = totalUsedUSDT;
              order.status = 0;
              await order.save();
              let n_order = new FutureOrder({
                pair_id: order.pair_id,
                pair_name: order.pair_name,
                type: order.type,
                future_type: order.future_type,
                method: order.method,
                user_id: order.user_id,
                usedUSDT: totalUsedUSDT,
                required_margin: totalUsedUSDT,
                isolated: totalUsedUSDT,
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
              open_price: order.target_price,
            });
            await n_order.save();
            order.status = 0;
            await order.save();
          }
        }
      }
    }
    else if (order.method == 'stop_limit') {
      //let item = list.find(x => x.s == order.pair_name.replace('/', ''));
      let item = await axios("http://global.oxhain.com:8542/price?symbol=" + order.pair_name.replace("/", ""));
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
      //let findBinanceItem = list.filter(x => x.s == order.pair_name.replace('/', ''));
      let findBinanceItem = await axios("http://global.oxhain.com:8542/price?symbol=" + order.pair_name.replace("/", ""));
      if (findBinanceItem != null) {
        let item = findBinanceItem.data;
        if (order.type == 'buy') {
          let price = parseFloat(item.data.ask);
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
          let price = item.data.bid;
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

}


function splitLengthNumber(q) {
  return q.toString().length > 4 ? parseFloat(q.toString().substring(0, 4)) : q;
}

initialize();
