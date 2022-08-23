require("dotenv").config();
const WebSocket = require('ws');
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
const MarginOrder = require('./models/MarginOrder.js');
const mongoose = require("mongoose");
const Wallet = require("./models/Wallet.js");
var mongodbPass = process.env.MONGO_DB_PASS;

const io = new Server();
var mongodbPass = process.env.MONGO_DB_PASS;

var connection =
  "mongodb+srv://volkansaka:" +
  mongodbPass +
  "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority";
const MarginWalletId = "62ff3c742bebf06a81be98fd";
async function initialize() {
    await mongoose.connect(connection);

    //await mongoClient.connect();



  /*

  await mongoCollection.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 3600, background: true }
  );
  */

  console.log(1);
  let orders = await MarginOrder.find({status: 0}).exec();
  console.log(2);


  let OrderStream = MarginOrder.watch([{ $match: {operationType: {$in: ['insert']}}}]).on('change', data => {
    console.log("new order");
    orders = data;
  });
  let OrderStream2 = MarginOrder.watch([{ $match: {operationType: {$in: ['update']}}}]).on('change', data => {
    console.log("update order ");
    orders = data;
  });


    
    

    const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    allTickers.onopen = () => {
        allTickers.onmessage =  async (data) => {
            let list = JSON.parse(data.data);
            for (var i = 0; i < list.length; i++) {
                let symbol = list[i].s.replace("/", "");
                for(var k = 0; k < orders.length; k++) {
                    let order = orders[k];
                    
                    if(order.pair_name == symbol) {
                        let price = parseFloat(list[i].a);
                        let open_price = parsefloat(order.open_price) * parseInt(order.leverage).toFixed(2);
                        
                        let userBalance = await Wallet.findOne({user_id : order.user_id, coin_id : MarginWalletId});
                        
                        let balance = (userBalance.amount * 1.0).toFixed(2);
                        if(order.type == 'buy') {
                            
                            let pl = (open_price - price).toFixed(2);
                            if(pl == null) continue;
                            balance += pl * 1.0;
                            let tp = order.tp ?? 0.00;
                            let sl = order.sl ?? 0.00;
                            if(balance <= 0) {
                                order.status = 1;
                                userBalance.amount = 0;
                                order.close_price = price;
                                order.close_time = Date.now();
                                await order.save();
                                userBalance.save();
                            } else {
                                if(tp != 0) {
                                    if(price >= tp) {
                                        order.status = 1;   
                                        await order.save();
                                    }
                                    
                                }
                                if(sl != 0) {
                                    if(price <= sl) {
                                        order.status = 1;   
                                        await order.save();
                                    }
                                }
                                console.log("Balance : " + balance);
                                
                                userBalance.amount = balance;
                                await userBalance.save();
                            }
                            
                            
                        } else if(order.type == 'sell') {
                            
                            let pl = (price - open_price).toFixed(2);
                            if(pl == null) continue;
                            balance += (pl * 1.0).toFixed(2);
                            let tp = order.tp ?? 0.00;
                            let sl = order.sl ?? 0.00;
                            if(balance <= 0) {
                                order.status = 1;
                                balance = 0;
                                order.close_price = price;
                                order.close_time = Date.now();
                                await order.save();
                                
                            } else {
                                if(tp != 0) {
                                    if(price <= tp) {
                                        order.status = 1;   
                                        await order.save();
                                    }
                                    
                                }
                                if(sl != 0) {
                                    if(price >= sl) {
                                        order.status = 1;   
                                        await order.save();
                                    }
                                }
                            }
                            userBalance.balance = balance;
                            await userBalance.save();
                        } 
                        //console.log("Price : ", price , " | P/L : ", pl, " | User Balance : ", userBalance.amount);
;                    }
                }
            }
        }

    }
}


async function getOrders() {
    orders = await MarginOrder.find({ status: 0 }).exec();
    console.log(orders);
}

initialize();