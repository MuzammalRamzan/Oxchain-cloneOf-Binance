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
const Pairs = require("./models/Pairs.js");
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
              margin_type: 'cross'
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
            console.log(price);
            console.log(order.stop_limit);
            if (order.stop_limit != 0) {
              if (order.type == 'buy') {
                if (price >= order.target_price) {
                  order.method = 'market';
                  order.status = 0;
                  await order.save();
                }
              } else if (order.type == 'sell') {
                if (price <= order.target_price) {

                  order.method = 'market';
                  order.status = 0;
                  await order.save();
                }
              }
            } else {
              if (order.type == 'buy') {
                if (price <= order.target_price) {
                  order.method = 'market';
                  order.status = 0;
                  await order.save();
                }
              } else if (order.type == 'sell') {
                if (price >= order.target_price) {

                  order.method = 'market';
                  order.status = 0;
                  await order.save();
                }
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

          console.log(data.total + " | " + data.usedUSDT);
          console.log(totalWallet);

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
          let findBinanceItem = list.filter(x => x.s == order.pair_name.replace('/', ''));
          if (findBinanceItem != null) {
            let item = findBinanceItem[0];
            if (order.type == 'buy') {
              let price = item.a;
              console.log(price);
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




      //FILL WALLET
    };
  };
}

initialize();
