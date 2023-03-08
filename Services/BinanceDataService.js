const { default: axios } = require("axios");
const WebSocket = require("ws");
const WebSocketServer = require("ws").Server;
const MarketDBConnection = require("../MarketDBConnection");
const MarketTradeModel = require("../models/BinanceData/MarketTradeModel");
const OrderBookModel = require("../models/BinanceData/OrderBookModel");
const QuoteModel = require("../models/BinanceData/QuoteModel");
const Pairs = require("../models/Pairs");
require('dotenv').config();

async function BinanceService() {
    await MarketDBConnection()
    BinanceDataFuture();
    BinanceDataSpot();
}
BinanceService();
async function BinanceDataSpot() {
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
        params.push(val.symbolOne.toLowerCase() + "usdt@trade");
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
                await OrderBookModel.updateOne({ symbol: data.s, market_type: 'spot' }, { $set: { buyLimit: data.B, sellLimit: data.A, buyPrice: data.b, sellPrice: data.a, market_type: 'spot' } }, { upsert: true });
                //ws.send(JSON.stringify({ type: "order_books", content: data }));
            } else if (data.e === "24hrTicker") {
                await QuoteModel.updateOne({ symbol: data.s, market_type: 'spot' }, {
                    $set: {
                        bid: data.b,
                        ask: data.a,
                        open: data.o,
                        high: data.h,
                        low: data.l,
                        close: data.c,
                        change: data.p,
                        changeDiff: data.P,
                        volume: data.v,
                        market_type: 'spot'
                    }
                }, { upsert: true });


            }  else if (data.e == 'trade') {
                await MarketTradeModel.updateOne({
                    symbol: data.s,
                    marketType: "spot",

                }, {
                    $set: {
                        eventTime: data.E,
                        price: data.p,
                        amount: data.q,
                        isMaker: data.m,
                    }
                }, {
                    upsert: true
                });
            } else {
                console.log(data.e);
            }
        }
    };
}

async function BinanceDataFuture() {

    let pairsData = await axios.get('https://api.oxhain.com/getPairs');
    coins = pairsData.data.data;
    let onlyCoins = [];
    coins.forEach(val => {
        onlyCoins.push({ 's': val.name.replace('/', '') });
    })

    var b_ws = new WebSocket("wss://fstream.binance.com/stream");

    // BNB_USDT => bnbusdt
    let params = [];
    /*
    params.push("btcusdt@bookTicker");
    params.push("btcusdt@ticker");
    */
    coins.forEach((val) => {
        params.push(val.symbolOne.toLowerCase() + "usdt@bookTicker");
        params.push(val.symbolOne.toLowerCase() + "usdt@ticker");
        params.push(val.symbolOne.toLowerCase() + "usdt@trade");
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

                //ws.send(JSON.stringify({ type: "order_books", content: data }));
            }
            else if (data.e === 'bookTicker') {
                await OrderBookModel.updateOne({ symbol: data.s, market_type: 'future' }, { $set: { buyLimit: data.B, sellLimit: data.A, buyPrice: data.a, sellPrice: data.b, market_type: 'future' } }, { upsert: true });
            } else if (data.e === "24hrTicker") {
                await QuoteModel.updateOne({ symbol: data.s, market_type: 'future' }, {
                    $set: {
                        bid: data.c,
                        ask: data.c,
                        open: data.o,
                        high: data.h,
                        low: data.l,
                        close: data.c,
                        change: data.p,
                        changeDiff: data.P,
                        volume: data.v,
                        market_type: 'future'
                    }
                }, { upsert: true });


            } else if (data.e == 'trade') {
                await MarketTradeModel.updateOne({
                    symbol: data.s,
                    marketType: "future",

                }, {
                    $set: {
                        eventTime: data.E,
                        price: data.p,
                        amount: data.q,
                        isMaker: data.m,
                    }
                }, {
                    upsert: true
                });
            } else {
                console.log(data.e);
            }
        }
    };
}
