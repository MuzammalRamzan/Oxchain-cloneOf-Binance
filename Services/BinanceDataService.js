const { default: axios } = require("axios");
const WebSocket = require("ws");
const WebSocketServer = require("ws").Server;
const MarketDBConnection = require("../MarketDBConnection");
const OrderBookModel = require("../models/BinanceData/OrderBookModel");
const QuoteModel = require("../models/BinanceData/QuoteModel");
const Pairs = require("../models/Pairs");
require('dotenv').config();
async function BinanceData() {
    await MarketDBConnection()
    let pairsData = await axios.get('https://api.oxhain.com/getPairs');
    coins = pairsData.data.data;
    let onlyCoins = [];
    coins.forEach(val => {
        onlyCoins.push({ 's': val.name.replace('/', '') });
    })

    var b_ws = new WebSocket("wss://stream.binance.com/stream");

    // BNB_USDT => bnbusdt
    let params = [];
    coins.forEach((val) => {
        params.push(val.symbolOne.toLowerCase() + "usdt@bookTicker");
        params.push(val.symbolOne.toLowerCase() + "usdt@ticker");
    });
    const initSocketMessage = {
        method: "SUBSCRIBE",
        params: params,

        id: 1,
    };

    b_ws.onopen = (event) => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };

    // Reconnect connection when disconnect connection
    b_ws.onclose = () => {
        b_ws.send(JSON.stringify(initSocketMessage));
    };

    b_ws.onmessage = async function (event) {
        const data = JSON.parse(event.data).data;

        if (data != null && data != "undefined") {
            if (data.A && data.a && data.b && data.B && !data.e) {
                await OrderBookModel.findOneAndUpdate({ symbol: data.s }, { $set: { buyLimit: data.B, sellLimit: data.A, buyPrice: data.b, sellPrice: data.a } }, { upsert: true });
                //ws.send(JSON.stringify({ type: "order_books", content: data }));
            } else if (data.e === "24hrTicker") {
                await QuoteModel.findOneAndUpdate({ symbol: data.s }, {
                    $set: {
                        bid: data.b,
                        ask: data.a,
                        open: data.o,
                        high: data.h,
                        low: data.l,
                        close: data.c,
                        change: data.p,
                        changeDiff: data.P,
                        volume: data.v
                    }
                }, { upsert: true });


            } else {
                console.log(data.e);
            }
        }
    };
}

BinanceData();