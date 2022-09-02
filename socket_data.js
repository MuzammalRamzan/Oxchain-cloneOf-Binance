
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

var connection =
   "mongodb+srv://volkansaka:" +
   mongodbPass +
   "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority";

wss.on("connection", async (ws) => {
   console.info("websocket connection open");
   await mongoose.connect(connection);
   if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
         msg1: 'yo, im msg 1'
      }))

      ws.on('message', (data) => {
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
            default:
               break;
         }
      });
   }
});

async function GetWallets(ws, wallet_id) {
   let wallet = await Wallet.findOne({ _id: wallet_id }).exec();
   let isUpdate = Wallet.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ _id: wallet_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });
   ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
}

async function GetOrders(ws, payload) {
   let user_id = payload['user_id'];
   let type = payload['type'] ?? "";
   let request = { user_id: user_id };
   if (type != "")
      request["type"] = type;
   console.log(request);
   let orders = await Orders.find(request).exec();
   ws.send(JSON.stringify({ type: 'orders', content: orders }));
   let isInsert = Orders.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });
   let isUpdate = Orders.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });
   let isRemove = Orders.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      console.log("silindi");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });

   let isDelete = Orders.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      console.log("silindi 2");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'orders', content: orders }));
   });


}


async function GetMarginOrders(ws, payload) {
   let user_id = payload['user_id'];
   let status = payload['status'];
   let orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();

   let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();

   });
   let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
   });
   let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      console.log("silindi");
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
   });

   let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      console.log("silindi 2");
      orders = await MarginOrder.find({ user_id: user_id, status: status }).exec();
   });

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