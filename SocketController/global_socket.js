"use strict";
const WebSocket = require("ws");
const WebSocketServer = require("ws").Server;
var https = require('https');
var fs = require('fs');
const MarginOrder = require("../models/MarginOrder");
const Wallet = require("../models/Wallet");
const mongoose = require("mongoose");
const Orders = require("../models/Orders");
require("dotenv").config();
const Connection = require("../Connection");
const Pairs = require("../models/Pairs");
const CoinList = require("../models/CoinList");
const Device = require("../models/Device");
const SpotOpenOrders = require("./trade/spot/spot_open_orders");
const SpotOrderHistory = require("./trade/spot/spot_order_history");
const SpotTradeHistory = require("./trade/spot/trade_history");
const CrossOpenOrders = require("./trade/cross/cross_open_orders");
const CrossOrderHistory = require("./trade/cross/cross_order_history");
const CrossPositions = require("./trade/cross/cross_positions");
const CrossFunds = require("./trade/cross/cross_funds");
const SpotFunds = require("./trade/spot/spot_funds");
const DerivativesFunds = require("./trade/derivatives/getDerivatives");
const IsolatedFunds = require("./trade/isolated/isolated_funds");
const IsolatedOpenOrders = require("./trade/isolated/isolated_open_orders");
const IsolatedOrderHistory = require("./trade/isolated/isolated_order_history");
const IsolatedPositions = require("./trade/isolated/isolated_positions");
const IsolatedTradeHistory = require("./trade/isolated/isolated_trade_history");
const CrossTradeHistory = require("./trade/cross/cross_trade_history");
const FutureWalletModel = require("../models/FutureWalletModel");
const FutureOrder = require("../models/FutureOrder");
const FuturePositions = require("./trade/future/positions");
const FutureOpenOrders = require("./trade/future/open_orders");
const FutureTradeHistory = require("./trade/future/trade_history");
const Withdraw = require("../models/Withdraw");
const FutureAssets = require("./trade/future/future_funds");
const FutureOrderHistory = require("./trade/future/order_history");
const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const FutureTransactionHistory = require("./trade/future/transaction_history");
const MarginCrossWallet = require("../models/MarginCrossWallet");
const MarginIsolatedWallet = require("../models/MarginIsolatedWallet");
const BinanceAPI = require("../BinanceAPI");
const CheckLogoutDevice = require("./device/check_logout_device");
const { default: axios } = require("axios");
var route = express();

var wss = null;
if (process.env.NODE_ENV == 'product') {
    var options = {
        key: fs.readFileSync('/etc/letsencrypt/live/global.oxhain.com/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/global.oxhain.com/cert.pem')
    };

    var server = https.createServer(options);
    server.listen(7010);
    wss = new WebSocketServer({ server });
}
else {
    wss = new WebSocketServer({ port: 7010 });
}


route.use(cors());
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));
route.get("/price", (req, res) => {
    var symbol = req.query.symbol;
    if (symbol == null) {
        res.json({ 'status': 'fail', 'msg': 'symbol not found' });
        return;
    }
    let data = global.MarketData[symbol];
    res.json({ 'status': 'success', 'data': data });
});
route.get('/getCandleData', async (req, res) => {
    try {
        let symbol = req.query.symbol;
        if (symbol == null)
            return res.send({ status: 'fail', message: 'Symbol not found' });
        let dt = new Date();
        let now = dt.getTime();
        dt.setDate(dt.getDate() - 1);
        let yesterday = dt.getTime();

        symbol = symbol.replace('/', '');

        let uri = "https://api.binance.com/api/v3/klines?symbol=" + symbol + "&interval=1h&startTime=" + yesterday + "&endTime=" + now + "";
        let candleData = axios.get(uri);
        let data = (await candleData).data;
        let ret = [];
        data.forEach(x => {
            ret.push(x[2]);
        });
        return res.json({ status: 'success', data: ret });
    } catch (err) {
        console.log(err);
        return res.json({ status: 'fail', message: "Unknow error" });
    }
});
route.get('/24hr', async (req, res) => {
    let data = await axios("https://api.binance.com/api/v3/ticker/24hr");
    var symbol = req.query.symbol;
    if (symbol != null) {
        let item = data.data.filter((x) => x.symbol == symbol);
        return res.json(item);
    }
    if (req.query.symbols != null) {
        let symbols = req.query.symbols.replaceAll('/', '').split(',');
        let item = data.data.filter((x) => symbols.indexOf(x.symbol) != -1);
        return res.json(item);
    }
    return res.json(data.data);
})



route.listen(8542, () => {
    console.log("Server Ayakta");
});



global.MarketData = {};

async function GlobalSocket() {
    fillMarketPrices();
    await Connection.connection();
    console.log("DB Connect");
    //await FutureWalletModel.updateMany({amount : 1000});
    wss.on("connection", async (ws) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(
                JSON.stringify({
                    msg1: "WELCOME TO OXHAIN",
                })
            );
            ws.on("message", async (data) => {
                let json = JSON.parse(data);
                if (json.page == "trade") {
                    GetBinanceData(ws, json.pair);
                } else if (json.page == "market") {
                    GetMarketData(ws);
                } else if (json.page == "all_prices") {
                    GetAllPrices(ws);
                }
                else if (json.page == 'check_logout') {
                    CheckLogoutDevice(ws, json.user_id);
                }
            });
        }
    });
}

async function GetMarketData(ws, pair) {
    var b_ws = new WebSocket("wss://stream.binance.com/stream");

    // BNB_USDT => bnbusdt
    let coins = await CoinList.find({ status: 1 });
    let params = [];
    coins.forEach((val) => {
        params.push(val.symbol.toLowerCase() + "usdt@aggTrade");
        params.push(val.symbol.toLowerCase() + "usdt@bookTicker");
        params.push(val.symbol.toLowerCase() + "usdt@trade");
        params.push(val.symbol.toLowerCase() + "usdt@ticker");
        params.push(val.symbol.toLowerCase() + "usdt@miniTicker");
    });
    const initSocketMessage = {
        method: "SUBSCRIBE",
        params: params,
        /*
        params: [
            `${noSlashPair}@aggTrade`,
            `${noSlashPair}@bookTicker`,
            `${noSlashPair}@trade`,
            `${noSlashPair}@ticker`,
            "!miniTicker@arr",
        ],
        */
        // params: ["!miniTicker@arr"],
        id: 1,
    };

    b_ws.onopen = (event) => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };

    // Reconnect connection when disconnect connection
    b_ws.onclose = () => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };

    b_ws.onmessage = function (event) {
        const data = JSON.parse(event.data).data;
        if (data != null && data != "undefined") {
            if (data.A && data.a && data.b && data.B && !data.e) {
                ws.send(JSON.stringify({ type: "order_books", content: data }));
            } else if (data.e === "aggTrade") {
                ws.send(JSON.stringify({ type: "prices", content: data }));
            } else if (data.e === "trade") {
                ws.send(JSON.stringify({ type: "trade", content: data }));
            } else if (data.e === "24hrMiniTicker") {
                ws.send(JSON.stringify({ type: "market", content: data }));
            } else if (data.e === "24hrTicker") {
                ws.send(JSON.stringify({ type: "ticker", content: data }));
            }
        }
    };
}

async function GetBinanceData(ws, pair) {
    if (pair == "" || pair == null || pair == "undefined") return;

    let coins = await Pairs.find({ status: 1 });

    let onlyCoins = [];
    coins.forEach(val => {
        onlyCoins.push({ 's': val.name.replace('/', '') });
    })

    var b_ws = new WebSocket("wss://stream.binance.com/stream");

    // BNB_USDT => bnbusdt
    const noSlashPair = pair.replace("_", "").toLowerCase();

    const initSocketMessage = {
        method: "SUBSCRIBE",
        params: [
            `${noSlashPair}@aggTrade`,
            `${noSlashPair}@bookTicker`,
            `${noSlashPair}@trade`,
            "!miniTicker@arr",
        ],
        // params: ["!miniTicker@arr"],
        id: 1,
    };

    b_ws.onopen = (event) => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };

    // Reconnect connection when disconnect connection
    b_ws.onclose = () => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };

    b_ws.onmessage = function (event) {
        const data = JSON.parse(event.data).data;
        if (data != null && data != "undefined") {
            if (data.A && data.a && data.b && data.B && !data.e) {
                ws.send(JSON.stringify({ type: "order_books", content: data }));
            } else if (data.e === "aggTrade") {
                ws.send(JSON.stringify({ type: "prices", content: data }));
            } else if (data.e === "trade") {
                ws.send(JSON.stringify({ type: "trade", content: data }));
            } else if (data[0].e === "24hrMiniTicker") {
                // console.log(data);
                data.forEach(symbolInfo => {
                    let index = onlyCoins.findIndex(x => x.s == symbolInfo.s);
                    if(index != -1) {
                        onlyCoins[index] = symbolInfo;
                        ws.send(JSON.stringify({ type: "market", content: onlyCoins }));
                    }
                });
               

            }
        }
    };
}

async function GetAllPrices(ws) {
    var b_ws = new WebSocket("wss://stream.binance.com/stream");
    const initSocketMessage = {
        method: "SUBSCRIBE",
        params: ["!ticker@arr"],
        // params: ["!miniTicker@arr"],
        id: 1,
    };

    b_ws.onopen = (event) => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };

    // Reconnect connection when disconnect connection
    b_ws.onclose = () => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };
    b_ws.onmessage = function (event) {
        const data = JSON.parse(event.data).data;
        if (data != null && data != "undefined") {
            for (var m = 0; m < data.length; m++) {
                let x = data[m];
                if (Object(global.MarketData).hasOwnProperty(x.s)) {
                    global.MarketData[x.s] = {
                        bid: x.b,
                        ask: x.a,
                        change: x.P,
                    };
                }

            }
            ws.send(JSON.stringify(global.MarketData));
        }
    };
}


async function fillMarketPrices() {
    let coinList = await CoinList.find({});
    try {
        var b_ws = new WebSocket("wss://stream.binance.com/stream");

        for (var k = 0; k < coinList.length; k++) {
            global.MarketData[coinList[k].symbol + "USDT"] = { bid: 0.0, ask: 0.0 };
        }

        const initSocketMessage = {
            method: "SUBSCRIBE",
            params: ["!ticker@arr"],
            // params: ["!miniTicker@arr"],
            id: 1,
        };

        b_ws.onopen = (event) => {
            b_ws.send(JSON.stringify(initSocketMessage));
        };

        // Reconnect connection when disconnect connection
        b_ws.onclose = () => {
            b_ws.send(JSON.stringify(initSocketMessage));
        };
        b_ws.onmessage = function (event) {
            const data = JSON.parse(event.data).data;
            if (data != null && data != "undefined") {
                for (var m = 0; m < data.length; m++) {
                    let x = data[m];
                    if (global.MarketData[x.s] != null)
                        global.MarketData[x.s] = { bid: x.b, ask: x.a };
                }
            }
        };
    } catch (err) {
        console.log(err.message);
    }
}


GlobalSocket();