
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
const Pairs = require('./models/Pairs');
var mongodbPass = process.env.MONGO_DB_PASS;
const MarginWalletId = "62ff3c742bebf06a81be98fd";

async function main() {
   console.log("start");
   await Connection.connection();
   console.log("DB Connect");
   wss.on("connection", async (ws) => {
      console.info("websocket connection open");
      if (ws.readyState === ws.OPEN) {
         ws.send(JSON.stringify({
            msg1: 'WELCOME TO OXHAIN'
         }))
         ws.on('message', (data) => {
            let json = JSON.parse(data);
            GetBinanceData(ws, json.pair);
            if (json.user_id != null && json.user_id != 'undefined') {
               GetWallets(ws, json.user_id);
               GetOrders(ws, json.user_id, json.spot_order_type ?? '');
               GetMarginOrders(ws, json.user_id, json.margin_order_type, json.margin_order_method_type);
               GetMarginBalance(ws, json.user_id);
            }

         });
      }
   });

}

main();



async function GetBinanceData(ws, pair) {
   if(pair == '' || pair == null || pair == 'undefined') return;
   var b_ws = new WebSocket("wss://stream.binance.com/stream");

   // BNB_USDT => bnbusdt
   const noSlashPair = pair.replace('_', '').toLowerCase();

   const initSocketMessage = {
      method: "SUBSCRIBE",
      params: [`${noSlashPair}@aggTrade`, `${noSlashPair}@bookTicker`, `${noSlashPair}@trade`, "!miniTicker@arr"],
      // params: ["!miniTicker@arr"],
      id: 1,
   };

   b_ws.onopen = (event) => {
      b_ws.send(JSON.stringify(initSocketMessage));
   };

   // Reconnect connection when disconnect connection
   b_ws.onclose = () => {
      b_ws.send(JSON.stringify(initSocketMessage));
   }



   b_ws.onmessage = function (event) {

      const data = JSON.parse(event.data).data;
      if (data != null && data != 'undefined') {
         if (data.A && data.a && data.b && data.B && !data.e) {
            ws.send(JSON.stringify({ type: "order_books", content: data }));
         } else if (data.e === 'aggTrade') {
            ws.send(JSON.stringify({ type: "prices", content: data }));
         } else if (data.e === 'trade') {
            ws.send(JSON.stringify({ type: "trade", content: data }));
         } else if (data[0].e === '24hrMiniTicker') {
            // console.log(data);
            ws.send(JSON.stringify({ type: "market", content: data }));
         }
      }
   }

}


async function CalculateMarginBalance(user_id) {
   let totalPNL = 0.0;
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
   let wallet = await Wallet.findOne({ user_id: user_id, coin_id: MarginWalletId }).exec();
   if(wallet == null) return 0;
   let totalUSDT = 0.0;
   for (var n = 0; n < getOpenOrders.length; n++) {
      totalPNL = totalPNL + (getOpenOrders[n].total);
      totalUSDT = getOpenOrders[n].usedUSDT;
   }
   let balance = (wallet.amount);
   console.log("B : ", balance);
   return balance;
}

async function GetMarginBalance(ws, user_id) {
   let balance = await CalculateMarginBalance(user_id);
   console.log("balance : ", balance);
   ws.send(JSON.stringify({ type: "margin_balance", content: balance }));
   let isUpdate = Wallet.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      balance = await CalculateMarginBalance(user_id)
      ws.send(JSON.stringify({ type: "margin_balance", content: balance }));
   });
}


async function SendWallet(ws, _wallets) {
   var wallets = new Array();
   for (var i = 0; i < _wallets.length; i++) {
      let item = _wallets[i];

      let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
      if (pairInfo == null) continue;
      wallets.push({
         id: item._id,
         coin_id: item.coin_id,

         balance: item.amount,
         address: item.address,
         symbolName: pairInfo.name,
      });
   }
   ws.send(JSON.stringify({ type: 'wallet', content: wallets }));
}

async function GetWallets(ws, user_id) {
   let wallet = await Wallet.find({ user_id: user_id }).exec();
   SendWallet(ws, wallet);

   let isInsert = Wallet.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
      //orders = data;
      console.log("insert order socket");
      wallet = await Wallet.find({ user_id: user_id }).exec();
      SendWallet(ws, wallet);
   });
   let isUpdate = Wallet.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ user_id: user_id }).exec();
      SendWallet(ws, wallet);
   });
   let isRemove = Wallet.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ user_id: user_id }).exec();
      SendWallet(ws, wallet);
   });

   let isDelete = Wallet.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
      wallet = await Wallet.find({ user_id: user_id }).exec();
      SendWallet(ws, wallet);
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
      if (data.updateDescription.updatedFields.type == 'market') {
         ws.send(JSON.stringify({ type: "filled_spot_order", content: { order_id: data.documentKey._id } }));
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
   console.log("Margin orders");
      console.log(user_id);
   let request = { user_id: user_id, status: { $gt: -1 } };

   if (margin_order_type != null && margin_order_type != "") request['margin_type'] = margin_order_type;
   if (margin_order_method_type != null && margin_order_method_type != "") request['method'] = margin_order_method_type;


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
