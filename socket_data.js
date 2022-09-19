
"use strict";
const WebSocket = require('ws');
const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ port: 7010 });
const MarginOrder = require('./models/MarginOrder');
const Wallet = require('./models/Wallet');
const mongoose = require("mongoose");
const Orders = require('./models/Orders');
require("dotenv").config();
const Connection = require('./Connection');
var mongodbPass = process.env.MONGO_DB_PASS;
const MarginWalletId = "62ff3c742bebf06a81be98fd";

Connection.connection();

wss.on("connection", async (ws) => {
   console.info("websocket connection open");
   if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
         msg1: 'WELCOME TO OXHAIN'
      }))
      ws.on('message', (data) => {
         let json = JSON.parse(data);
         GetWallets(ws, data.user_id);
         GetOrders(ws, data.user_id, data.spot_order_type ?? '');
         GetMarginOrders(ws, data.user_id, data.margin_order_type, data.margin_order_method_type);
         GetMarginBalance(ws,data.user_id);
      });
   }
});



async function CalculateMarginBalance(user_id) {
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
   let wallet = await Wallet.findOne({ user_id: user_id, coin_id: MarginWalletId }).exec();
   for (var n = 0; n < getOpenOrders.length; n++) {
       totalPNL = totalPNL + parseFloat(getOpenOrders[n].total);
   }
   if(wallet.amount == 0) return 0;
   let balance = parseFloat(wallet.amount) + totalPNL;
   return balance;
}

async function GetMarginBalance(ws, user_id) {
   let balance = await CalculateMarginBalance(user_id);
   ws.send(JSON.stringify({type: "margin_balance", content : balance}));
   let isUpdate = Wallet.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      balance = await CalculateMarginBalance(user_id)
      ws.send(JSON.stringify({type: "margin_balance", content : balance}));
   });
}

async function GetWallets(ws, user_id) {
   
   let wallet = await Wallet.findOne({ user_id: user_id }).exec();
   ws.send(JSON.stringify({ type: 'wallet', content: wallet }));

   let isInsert = Orders.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      console.log("insert order socket");
      wallet = await Wallet.find({ user_id: user_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });
   let isUpdate = Orders.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ user_id: user_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });
   let isRemove = Orders.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ user_id: user_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });

   let isDelete = Orders.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ user_id: user_id }).exec();
      ws.send(JSON.stringify({ type: 'wallet', content: wallet }));
   });
}

async function GetOrders(ws, user_id, type) {
   
   let request = { user_id: user_id };
   if (type != "")
      request["type"] = type;
   
   let orders = await Orders.find(request).exec();
   ws.send(JSON.stringify({ type: 'spot_orders', content: orders }));
   let isInsert = Orders.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      console.log("insert order socket");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'spot_orders', content: orders }));
   });
   let isUpdate = Orders.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      if(data.updateDescription.updatedFields.type == 'market') {
         ws.send(JSON.stringify({type:"filled_spot_order", content : {order_id : data.documentKey._id}}));
      }
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'spot_orders', content: orders }));
   });
   let isRemove = Orders.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      console.log("silindi");
      console.log("del order socket");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'spot_orders', content: orders }));
   });

   let isDelete = Orders.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      console.log("silindi 2");
      console.log("del order socket");
      orders = await Orders.find(request).exec();
      ws.send(JSON.stringify({ type: 'spot_orders', content: orders }));
   });


}


async function GetMarginOrders(ws, user_id, margin_order_type, margin_order_method_type) {
   
   let request = { user_id: user_id, status : {$gt : 0}};

   if(margin_order_type != "") request['margin_type'] = margin_order_type;
   if(margin_order_method_type != "") request['method'] = margin_order_method_type;

   
   let orders = await MarginOrder.find(request).exec();
   ws.send(JSON.stringify({ type: 'margin_orders', content: orders }));
   let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      console.log("inserted");
      orders = await MarginOrder.find(request).exec();
      ws.send(JSON.stringify({ type: 'margin_orders', content: orders }));
   });
   let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      orders = await MarginOrder.find(request).exec();
      ws.send(JSON.stringify({ type: 'margin_orders', content: orders }));
   });
   let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      console.log("silindi");
      orders = await MarginOrder.find(request).exec();
      ws.send(JSON.stringify({ type: 'margin_orders', content: orders }));
   });

   let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      console.log("silindi 2");
      orders = await MarginOrder.find(request).exec();
      ws.send(JSON.stringify({ type: 'margin_orders', content: orders }));
   });
  
}
