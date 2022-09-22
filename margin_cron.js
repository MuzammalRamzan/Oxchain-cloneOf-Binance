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
            let totalPNL = 0.0;

            let getOpenOrders = await MarginOrder.aggregate([
                {
                    $match: { status: 0, method: "market", margin_type: "cross" },
                },

                {
                    $group: {
                        _id: "$user_id",
                        total: { $sum: "$pnl" },
                        usedUSDT: { $sum: "$usedUSDT" }
                    },
                },
            ]);

            for (var n = 0; n < getOpenOrders.length; n++) {
                let wallet = await Wallet.findOne({
                    user_id: getOpenOrders[n]._id,
                    coin_id: MarginWalletId,
                }).exec();
                let marginWalletAmount = wallet.amount;


                wallet.pnl = getOpenOrders[n].total;
                await wallet.save();

                totalPNL = parseFloat(getOpenOrders[n].total);


                let totalWallet = marginWalletAmount + (totalPNL + getOpenOrders[n].usedUSDT);
                console.log("Total Wallet: ", totalWallet);
                if (totalWallet <= 0) {
                    wallet.pnl = 0;
                }
                else {
                    wallet.pnl = getOpenOrders[n].total;
                }
                await wallet.save();



                for (var i = 0; i < list.length; i++) {


                    let symbol = list[i].s.replace("/", "");

                    let current_price = list[i].a;

                }


                /*
                                for (var i = 0; i < list.length; i++) {
                
                
                                    let symbol = list[i].s.replace("/", "");
                
                                    let current_price = list[i].a;
                                    console.log("Current Price: ", current_price);
                
                                    let userData = await User.findOne(
                                        {
                                            _id: getOpenOrders[n]._id
                                        }
                                    ).exec();
                
                                    let userId = userData._id;
                
                
                                    let get = await MarginOrder.find({ user_id: userId, margin_type: 'cross', status: 0, method: 'market' }).exec();
                                    for (var m = 0; m < get.length; m++) {
                                        if (get[m].pair_name.replace('/', '') == symbol) {
                                            let pnl = (current_price * get[m].amount) - (get[m].open_price * get[m].amount);
                                        }
                
                                    }
                
                                }
                */

            }




            //FILL WALLET
        };
    };
}

initialize();
