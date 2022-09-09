
"use strict";
const WebSocket = require('ws');
const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ port: 7010 });
const MarginOrder = require('./models/MarginOrder');
const Wallet = require('./models/Wallet');
const mongoose = require("mongoose");
const Orders = require('./models/Orders');
require("dotenv").config();
var mongodbPass = process.env.MONGO_DB_PASS;
const MarginWalletId = "62ff3c742bebf06a81be98fd";
var connection =
   "mongodb+srv://volkansaka:" +
   mongodbPass +
   "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority";

wss.on("connection", async (ws) => {
   console.info("websocket connection open");
   await mongoose.connect(connection);
   if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
         msg1: 'WELCOME TO OXHAIN'
      }))

      ws.on('message', (data) => {
         console.log("MSG");
         console.log(data.toString());
         console.log(JSON.parse(data));
         let json = JSON.parse(data);
         switch (json.type) {
            case "margin_orders":
               GetMarginOrders(ws, json.content);
               break;
            case "wallet":
               GetWallets(ws, json.content);
               break;
            case "spot_orders":
               GetOrders(ws, json.content);
               break;
            case "margin_history":
               GetMarginHistories(ws, json.content);
               break;
               case "margin_balance" : 
               break;
            default:
               break;
         }
      });
   }
});

async function GetMarginBalance(ws, user_id) {
   let totalPNL = 0.0;
            
   let getOpenOrders = await MarginOrder.aggregate(
       [
           {
               $match: { status: 0, method: 'market', user_id: user_id },
           },

           {
               $group: {
                   _id: "$user_id", total: { $sum: "$pnl" }
               }
           }
       ],
   );
   for (var n = 0; n < getOpenOrders.length; n++) {
       let wallet = await Wallet.findOne({ user_id: getOpenOrders[n]._id, coin_id: MarginWalletId }).exec();
       wallet.pnl = getOpenOrders[n].total;
       totalPNL = totalPNL + parseFloat(getOpenOrders[n].total);
       await wallet.save();
   }
   let wallet = await Wallet.findOne({ user_id: getOpenOrders[n]._id, coin_id: MarginWalletId }).exec();
   let balance = parseFloat(wallet.amount) + totalPNL;
   ws.send(JSON.stringify({type: "margin_balance", content : balance}));
   console.log("Balance : ", balance);
}

async function GetWallets(ws, wallet_id) {
   if(wallet_id == '') {
      ws.send(JSON.stringify({ type: 'error', content: 'wallet not found' }));
      return;
   }
   let wallet = await Wallet.findOne({ _id: wallet_id }).exec();
   ws.send(JSON.stringify({ type: 'wallet', content: wallet }));

   let isInsert = Orders.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      console.log("insert order socket");
      wallet = await Wallet.find({ _id: wallet_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });
   let isUpdate = Orders.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ _id: wallet_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });
   let isRemove = Orders.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ _id: wallet_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });

   let isDelete = Orders.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ _id: wallet_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });
}

async function GetOrders(ws, payload) {
   
   let user_id = payload['user_id'];
   let type = payload['type'] ?? "";
   let request = { user_id: user_id };
   if (type != "")
      request["type"] = type;
   
   let orders = await Orders.find(request).exec();
   ws.send(JSON.stringify({ type: 'orders', content: orders }));
   let isInsert = Orders.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      console.log("insert order socket");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });
   let isUpdate = Orders.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      if(data.updateDescription.updatedFields.type == 'market') {
         ws.send(JSON.stringify({type:"filled_order", content : {order_id : data.documentKey._id}}));
      }
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });
   let isRemove = Orders.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      console.log("silindi");
      console.log("del order socket");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });

   let isDelete = Orders.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      console.log("silindi 2");
      console.log("del order socket");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });


}


async function GetMarginOrders(ws, payload) {
   let request = { user_id: payload['user_id'], status : {$gt : 0}};
   
   let orders = await MarginOrder.find({user_id: payload['user_id']}).exec();
   ws.send(JSON.stringify({ type: 'orders', content: orders }));
   let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      console.log("inserted");
      orders = await MarginOrder.find({user_id: payload['user_id']}).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });
   let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      console.log("updated");
      orders = await MarginOrder.find({user_id: payload['user_id']}).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });
   let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      console.log("silindi");
      orders = await MarginOrder.find({user_id: payload['user_id']}).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });

   let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      console.log("silindi 2");
      orders = await MarginOrder.find({user_id: payload['user_id']}).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });
   /*
   const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
   allTickers.onopen = () => {
      allTickers.onmessage = async (data) => {
         let list = JSON.parse(data.data);
         let exportOrder = [];
         for (var i = 0; i < list.length; i++) {
            let symbol = list[i].s.replace("/", "");
            for (var k = 0; k < orders.length; k++) {
               let order = orders[k];
               if (order.pair_name.replace('/', '') == symbol) {
                  let total = 0;
                  let open_price = parseFloat(order.open_price);
                  let price = 0.0;
                  if (order.type == 'buy') {
                     price = parseFloat(list[i].a);
                     let imr = 1 / order.leverage;
                     let initialMargin = order.amount * price * imr;
                     let pnl = 0.00;
                     if (order.status == 0)
                        pnl = (price - order.open_price) * order.amount;
                     else
                        pnl = (price - parseFloat(order.close_price ?? 0));
                     exportOrder.push({
                        id: order._id, type: 'buy',
                        symbol: order.pair_name, margin_type: order.margin_type,
                        leverage: order.leverage, amount: order.amount,
                        open_price: order.open_price, price: price, pnl: pnl, status: order.status
                     });
                  } else if (order.type = 'sell') {
                     price = parseFloat(list[i].b);
                     let imr = 1 / order.leverage;
                     let initialMargin = order.amount * price * imr;
                     let pnl = 0.00;
                     if (order.status == 0)
                        pnl = (order.open_price - price) * order.amount;
                     else
                        pnl = (parseFloat(order.close_price ?? 0) - price);
                     exportOrder.push({
                        id: order._id, type: 'sell',
                        leverage: order.leverage, amount: order.amount,
                        symbol: order.pair_name, margin_type: order.margin_type, open_price: order.open_price, price: price, pnl: pnl, status: order.status
                     });
                  }
               }
            }
         }
         ws.send(JSON.stringify({ type: 'orders', content: exportOrder }));
      }
   }
   */
}


async function GetMarginHistories(ws, payload) {
   let user_id = payload['user_id'];
   let status = 1;
   let orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
   GetOrderHistry(ws,orders);
   let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
      GetOrderHistry(ws,orders);
   });
   let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
      GetOrderHistry(ws,orders);
   });
   let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      console.log("silindi");
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
      GetOrderHistry(ws,orders);
   });

   let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      console.log("silindi 2");
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
      GetOrderHistry(ws,orders);
   });


}
async function GetOrderHistry(ws, orders) {
   let exportOrder = [];

   for (var k = 0; k < orders.length; k++) {
      let order = orders[k];

      let total = 0;
      let open_price = parseFloat(order.open_price);
      let price = 0.0;
      if (order.type == 'buy') {
         price = order.close_price;
         let imr = 1 / order.leverage;
         let initialMargin = order.amount * price * imr;
         let pnl = 0.00;
         if (order.status == 0)
            pnl = (price - order.open_price) * order.amount;
         else
            pnl = (price - parseFloat(order.close_price ?? 0));
         exportOrder.push({
            id: order._id, type: 'buy',
            symbol: order.pair_name, margin_type: order.margin_type,
            leverage: order.leverage, amount: order.amount,
            open_price: order.open_price, price: price, pnl: pnl, status: order.status
         });
      } else if (order.type = 'sell') {
         price = order.close_price;
         let imr = 1 / order.leverage;
         let initialMargin = order.amount * price * imr;
         let pnl = 0.00;
         if (order.status == 0)
            pnl = (order.open_price - price) * order.amount;
         else
            pnl = (parseFloat(order.close_price ?? 0) - price);
         exportOrder.push({
            id: order._id, type: 'sell',
            leverage: order.leverage, amount: order.amount,
            symbol: order.pair_name, margin_type: order.margin_type, open_price: order.open_price, price: price, pnl: pnl, status: order.status
         });
      }
   }
   ws.send(JSON.stringify({ type: 'orders', content: exportOrder }));
}
/*
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const WebSocket = require('ws');
const MarginOrder = require('./models/MarginOrder');
const Wallet = require('./models/Wallet');


app.get('/', function (req, res) {
   res.sendfile('socket_test.html');
});

app.get('/wallet', function (req, res) {

});

io.on('connection', function (socket) {
   console.log('A user connected');

   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });

   socket.on('wallets', function (user_id) {
      Wallet.find({ user_id: user_id }, function (err, data) {
         console.log(data);
      });
   });

   socket.on('margin_orders', async function (user_id) {
      console.log("margin orders");
      let orders = await MarginOrder.find({ status: 0 }).exec();

      let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
         //orders = data;
         orders = await MarginOrder.find({ status: 0 }).exec();

      });
      let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
         orders = await MarginOrder.find({ status: 0 }).exec();
      });
      let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
         console.log("silindi");
         orders = await MarginOrder.find({ status: 0 }).exec();
      });

      let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
         console.log("silindi 2");
         orders = await MarginOrder.find({ status: 0 }).exec();

      });


      const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
      allTickers.onopen = () => {
         allTickers.onmessage = async (data) => {
            let list = JSON.parse(data.data);
            for (var i = 0; i < list.length; i++) {
               let symbol = list[i].s.replace("/", "");
               for (var k = 0; k < orders.length; k++) {
                  let order = orders[k];
                  if (order.pair_name == symbol) {
                     let total = 0;
                     console.log(symbol);
                  }
               }
            }
         }
      }
   });

});

http.listen(7010, function () {
   console.log('listening on *:3000');
});

*/