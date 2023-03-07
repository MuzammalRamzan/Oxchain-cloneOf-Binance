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
const Pairs = require("./models/Pairs.js");
const mailer = require("./mailer");
const SiteNotificaitonModel = require("./models/SiteNotifications");
const User = require("./models/User");
var mongodbPass = process.env.MONGO_DB_PASS;
const UserNotifications = require("./models/UserNotifications");

const io = new Server();

const MarginWalletId = "62ff3c742bebf06a81be98fd";
async function initialize() {
  await Connection.connection();

  let request = {};
  let orders = await MarginOrder.find(request).exec();
  await Run(orders);
  let isInsert = MarginOrder.watch([
    { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
  ]).on("change", async (data) => {
    //orders = data;
    orders = await MarginOrder.find(request).exec();
    await Run(orders);
  });




}
async function Run(orders) {
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
          margin_type: 'cross'
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
              
              order.status = 0;
              await order.save();
              let n_order = new MarginOrder({
                pair_id: order.pair_id,
                pair_name: order.pair_name,
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
              let user = await User.findOne({ _id: order.user_id });
              if (user.email != null && user.email != '') {

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
                    mailer.sendMail(user.email, "Order Filled", "Your order has been filled");
                  }
                }
              }
              order.status = 0;
              await order.save();
              let n_order = new MarginOrder({
                pair_id: order.pair_id,
                pair_name: order.pair_name,
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
                let userBalance = await Wallet.findOne({
                  coin_id: MarginWalletId,
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
                order.status = 0;
                await order.save();
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
            order.status = 0;
            await order.save();
          }
        }
      }
    }
    else if (order.method == 'stop_limit') {
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

  let getOpenOrders = await MarginOrder.aggregate([
    {
      $match: { status: 0, method: "market", margin_type: "cross" },
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
    let total = parseFloat(data.total) + parseFloat(data.usedUSDT);


    let wallet = await Wallet.findOne({
      user_id: data._id,
      coin_id: MarginWalletId,
    }).exec();
    let marginWalletAmount = wallet.amount;

    //buraya isoleden gelen aktif emirlerin ana yatırma bakiyesini eklemeliyiz çünkü bütün margin wallet bakiyesini değiştiriyor bu fonksiyon
    wallet.pnl = data.total;
    await wallet.save();

    let totalWallet =
      marginWalletAmount + (data.total + data.usedUSDT);

    if (totalWallet <= 0) {
      wallet.pnl = 0;
      wallet.amount = 0;
      await MarginOrder.updateMany({ user_id: data._id, margin_type: 'cross', status: 0 }, { $set: { status: 1 } }).exec()
      await MarginOrder.updateMany({ user_id: data._id, margin_type: 'cross', method: 'limit' }, { $set: { status: -3 } }).exec()
      await MarginOrder.updateMany({ user_id: data._id, margin_type: 'cross', method: 'stop_limit' }, { $set: { status: -3 } }).exec()

    } else {
      wallet.pnl = data.total;
    }
    //
    await wallet.save();

    let userOrders = await MarginOrder.find({ user_id: data._id, method: 'market', margin_type: 'cross' }).exec();
    for (var k = 0; k < userOrders.length; k++) {
      let order = userOrders[k];
      if (order.status == 1) continue;
      let findBinanceItem = await axios("http://global.oxhain.com:8542/price?symbol=" + order.pair_name.replace("/", ""));
      if (findBinanceItem != null) {
        let item = findBinanceItem.data.data;
        if (order.type == 'buy') {
          let price = item.ask;

          let pnl = (price - order.open_price) * order.amount;
          order.pnl = pnl;
          await order.save();
        } else {
          let price = item.a;
          let pnl = (order.open_price - price) * order.amount;
          order.pnl = pnl;
          await order.save();
        }
      }

    }
  }
}
initialize();
