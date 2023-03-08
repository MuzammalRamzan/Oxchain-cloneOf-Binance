"use strict";
const WebSocket = require("ws");
const WebSocketServer = require("ws").Server;
var https = require('https');
var fs = require('fs');
require("dotenv").config();

const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const CheckLogoutDevice = require("./device/check_logout_device");
const loginApproveCheck = require("./device/login_approve_check");
const { default: axios } = require("axios");
const MarketDBConnection = require("../MarketDBConnection");
const FutureOrderBookModel = require("../models/BinanceData/FutureOrderBookModel");
const FutureQuoteModel = require("../models/BinanceData/FutureQuoteModel");
const SpotOrderBookModel = require("../models/BinanceData/SpotOrderBookModel");
const SpotQuoteModel = require("../models/BinanceData/SpotQuoteModel");
const FutureMarketTradeModel = require("../models/BinanceData/FutureMarketTradeModel");
const SpotMarketTradeModel = require("../models/BinanceData/SpotMarketTradeModel");
var route = express();
require('dotenv').config();
var wss = null;
if (process.env.NODE_ENV == 'product') {
    var options = {
        key: fs.readFileSync('/etc/letsencrypt/live/global.oxhain.com/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/global.oxhain.com/cert.pem')
    };

    var server = https.createServer(options);
    server.listen(7010);
    wss = new WebSocketServer({ server : server, perMessageDeflate: false });
}
else {
    wss = new WebSocketServer({ port: 7010, perMessageDeflate: false });
}
MarketDBConnection();

route.use(cors());
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));
route.get("/price", async (req, res) => {
    try {
        const symbol = req.query.symbol;
        if (symbol == null) {
            res.json({ 'status': 'fail', 'msg': 'symbol not found' });
            return;
        }

        symbol = symbol.replace('/', '').replace('_', '');
        const data = await QuoteModel.findOne({ symbol: symbol });
        return res.json({ 'status': 'success', 'data': data });
    } catch (err) {
        return res.json({ 'status': 'error', 'message': 'unknow error' });
    }
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
    try {
        let data = await axios("https://api.binance.com/api/v3/ticker/24hr");
        const symbol = req.query.symbol;
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
    } catch (err) {
        return res.json({ 'status': 'error', 'message': "unknow error" });
    }

})



route.listen(8542, () => {
    console.log("Server Ayakta");
});





async function GlobalSocket() {

    await MarketDBConnection()
    //await FutureWalletModel.updateMany({amount : 1000});
    try {
        wss.on("connection", async (ws) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(
                    JSON.stringify({
                        msg1: "WELCOME TO OXHAIN",
                    })
                );
                ws.on("message", async (data) => {
                    try {
                        let json = JSON.parse(data);
                        
                        if (json.page == 'spot_order_book') {
                            GetSpotOrderBooks(ws, json.pair);
                        } else if (json.page == 'spot_market_info') {
                            GetSpotMarketInfo(ws, json.pair);
                        } else if (json.page == 'future_order_book') {
                            GetFutureOrderBooks(ws, json.pair);
                        } else if (json.page == 'future_market_info') {
                            GetFutureMarketInfo(ws, json.pair);
                        } else if (json.page == 'spot_all_prices') {
                            GetMarketPrices(ws, 'spot');
                        } else if (json.page == 'future_all_prices') {
                            GetMarketPrices(ws, 'future');
                        }  else if (json.page == 'future_market_trade') {
                            GetFutureMarketTradeData(ws,json.pair, 'future');
                        }
                        else if (json.page == 'spot_market_trade') {
                            GetMarketTradeData(ws,json.pair, 'spot');
                        }
                        else if (json.page == 'check_logout') {
                            CheckLogoutDevice(ws, json.user_id);
                        } else if (json.page == 'login_approve_check') {
                            loginApproveCheck(ws, json.device_id);
                        }
                    } catch (err) {

                    }
                    /*
                    if (json.page == "trade") {
                        GetBinanceData(ws, json.pair);
                    } else if (json.page == "market") {
                        GetMarketData(ws);
                    } else if (json.page == "order_book") {
                        GetOrderBooks(ws, json.pair);
                    }
                    else if (json.page == "all_prices") {
                        GetAllPrices(ws);
                    }
                    
                    */
                });
            }
        });
    } catch (err) {

    }
}

async function GetMarketTradeData(ws, symbol ,market_type) {
    try {
        let items = await MarketTradeModel.findOne({ symbol : symbol, market_type: market_type }).select('symbol price amount isMaker')
        ws.send(JSON.stringify({ type: market_type + "_market_trade", content: items }));
        MarketTradeModel.watch([
            { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
        ]).on("change", async (data) => {
            let items = await MarketTradeModel.findOne({symbol :symbol,  market_type: market_type }).select('symbol price amount isMaker');
            if(items != null)
            ws.send(JSON.stringify({ type: market_type + "_market_trade", content: items }));
        })
    } catch (err) {

    }
}

async function GetMarketPrices(ws, market_type) {
    try {
        let items = await QuoteModel.find({ market_type: market_type }).select('symbol ask bid change changeDiff')
        ws.send(JSON.stringify({ type: market_type + "_all_prices", content: items }));
        QuoteModel.watch([
            { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
        ]).on("change", async (data) => {
            let items = await QuoteModel.find({ market_type: market_type }).select('symbol ask bid change changeDiff');
            ws.send(JSON.stringify({ type: market_type + "_all_prices", content: items }));
        })
    } catch (err) {

    }
}


async function GetFutureMarketTradeData(ws, symbol ,market_type) {
    try {
        let items = await FutureMarketTradeModel.findOne({ symbol : symbol, market_type: "future" }).select('symbol price amount isMaker')
        ws.send(JSON.stringify({ type: "future_market_trade", content: items }));
        FutureMarketTradeModel.watch([
            { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
        ]).on("change", async (data) => {
            let items = await FutureMarketTradeModel.findOne({symbol :symbol,  market_type: "future" }).select('symbol price amount isMaker');
            if(items != null)
            ws.send(JSON.stringify({ type: "future_market_trade", content: items }));
        })
    } catch (err) {

    }
}

async function GetFutureOrderBooks(ws, pair) {
    try {
        if (pair != null || pair != "") {
            let symbol = pair.replace('/', '').replace('_', '');
            let book = await FutureOrderBookModel.findOne({ symbol: symbol, market_type: 'future' });
            ws.send(JSON.stringify({ type: "future_order_book", content: book }));
            FutureOrderBookModel.watch([
                { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
            ]).on("change", async (data) => {
                let book = await FutureOrderBookModel.findOne({ _id: data.documentKey._id, market_type: 'future' });
                if (book != null)
                    ws.send(JSON.stringify({ type: "future_order_book", content: book }));
            })
        }
    } catch (err) {

    }
}


async function GetFutureMarketInfo(ws, pair) {
    try {
        if (pair != null || pair != "") {
            let symbol = pair.replace('/', '').replace('_', '');
            let quote = await FutureQuoteModel.findOne({ symbol: symbol, market_type: 'future' });
            ws.send(JSON.stringify({ type: "future_market_info", content: quote }));
            FutureQuoteModel.watch([
                { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
            ]).on("change", async (data) => {
                let quote = await FutureQuoteModel.findOne({ _id: data.documentKey._id, market_type: 'future' });
                if (quote != null)
                    ws.send(JSON.stringify({ type: "future_market_info", content: quote }));
            })
        }
    } catch (err) {

    }
}


async function GetSpoMarketTradeData(ws, symbol ,market_type) {
    try {
        let items = await SpotMarketTradeModel.findOne({ symbol : symbol, market_type: "spot" }).select('symbol price amount isMaker')
        ws.send(JSON.stringify({ type: "spot_market_trade", content: items }));
        SpotMarketTradeModel.watch([
            { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
        ]).on("change", async (data) => {
            let items = await SpotMarketTradeModel.findOne({symbol :symbol,  market_type: "spot" }).select('symbol price amount isMaker');
            if(items != null)
            ws.send(JSON.stringify({ type: "spot_market_trade", content: items }));
        })
    } catch (err) {

    }
}

async function GetSpotOrderBooks(ws, pair) {
    try {
        if (pair != null || pair != "") {
            let symbol = pair.replace('/', '').replace('_', '');
            let book = await SpotOrderBookModel.findOne({ symbol: symbol, market_type: 'spot' }, {'_id' : 0});
            ws.send(JSON.stringify({ type: "spot_order_book", content: book }));
            SpotOrderBookModel.watch([
                { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
            ]).on("change", async (data) => {
                let book = await SpotOrderBookModel.findOne({ _id: data.documentKey._id, market_type: 'spot' }, {'_id' : 0});
                if (book != null)
                    ws.send(JSON.stringify({ type: "spot_order_book", content: book }));
            })
        }
    } catch (err) {

    }
}


async function GetSpotMarketInfo(ws, pair) {
    try {
        if (pair != null || pair != "") {
            let symbol = pair.replace('/', '').replace('_', '');
            let quote = await SpotQuoteModel.findOne({ symbol: symbol, market_type: 'spot' });
            ws.send(JSON.stringify({ type: "spot_market_info", content: quote }));
            SpotQuoteModel.watch([
                { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
            ]).on("change", async (data) => {
                let quote = await SpotQuoteModel.findOne({ _id: data.documentKey._id,  market_type :'spot' });
                if(quote != null)
                ws.send(JSON.stringify({ type: "spot_market_info", content: quote }));
            })
        }
    } catch (err) {

    }
}




GlobalSocket();