const http = require("http");
const https = require("https");
const WebSocket = require("ws");
const WebSocketServer = require("ws").Server;
const socketio = require("socket.io");
var fs = require('fs');
const CheckLogoutDevice = require("./device/check_logout_device");
const SpotOpenOrders = require("./trade/spot/spot_open_orders");
const SpotOrderHistory = require("./trade/spot/spot_order_history");
const Connection = require("../Connection");
const SpotTradeHistory = require("./trade/spot/trade_history");
const SpotFunds = require("./trade/spot/spot_funds");
const DerivativesFunds = require("./trade/derivatives/getDerivatives");
const GetCrossWallet = require("./wallet/getCrossWallet");
const CrossOpenOrders = require("./trade/cross/cross_open_orders");
const CrossTradeHistory = require("./trade/cross/cross_trade_history");
const CrossOrderHistory = require("./trade/cross/cross_order_history");
const CrossPositions = require("./trade/cross/cross_positions");
const CrossFunds = require("./trade/cross/cross_funds");
const GetIsolatedWallet = require("./wallet/getIsolatedWallet");
const IsolatedOpenOrders = require("./trade/isolated/isolated_open_orders");
const IsolatedTradeHistory = require("./trade/isolated/isolated_trade_history");
const IsolatedOrderHistory = require("./trade/isolated/isolated_order_history");
const IsolatedPositions = require("./trade/isolated/isolated_positions");
const IsolatedFunds = require("./trade/isolated/isolated_funds");
const GetFutureWallet = require("./wallet/getFutureWallet");
const FuturePositions = require("./trade/future/positions");
const FutureOpenOrders = require("./trade/future/open_orders");
const FutureOrderHistory = require("./trade/future/order_history");
const FutureTradeHistory = require("./trade/future/trade_history");
const FutureTransactionHistory = require("./trade/future/transaction_history");
const FutureAssets = require("./trade/future/future_funds");
const GetSpotWallet = require("./wallet/getSpotWallet");
const CoinList = require("../models/CoinList");
const GetAssets = require("./wallet/getAssets");
const GetAssetsOverView = require("./wallet/getAssetsOverview");
const GetDerivatives = require("./wallet/getDerivatives");
const SocketRoomsModel = require("../models/SocketRoomsModel");

require("dotenv").config();

var server = null;
if (process.env.NODE_ENV == 'product') {
    server = https.createServer({
        key: fs.readFileSync('/etc/letsencrypt/live/socket.oxhain.com/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/socket.oxhain.com/cert.pem')
    });
} else {
    server = http.createServer();
}
const io = new socketio.Server(server, {
    cors: {
        origin: "*",
    }
});

module.exports = io;

Main();
async function Main() {
    await Connection.connection();
    io.on("connection", async (socket) => {

        socket.on('wallets', (user_id) => {

            checkRoomOrJoin('wallets', socket, user_id);
            GetSpotWallet(io.sockets, user_id);
        });
        socket.on('assets', (user_id) => {
            checkRoomOrJoin('assets', socket, user_id);
            GetAssets(io.sockets, user_id);
        });
        socket.on('assets_overview', (user_id) => {
            checkRoomOrJoin('assets_overview', socket, user_id);
            GetAssetsOverView(io.sockets, user_id);
        });
        socket.on('derivatives', (user_id) => {
            checkRoomOrJoin('derivatives', socket, user_id);
            GetDerivatives(io.sockets, user_id);
        });

        socket.on('spot_open_orders', (user_id) => {
            checkRoomOrJoin('spot_open_orders', socket, user_id);
            SpotOpenOrders(io.sockets, user_id);
        });

        socket.on('spot_order_history', (user_id) => {
            checkRoomOrJoin('spot_order_history', socket, user_id);
            SpotOrderHistory(io.sockets, user_id);
        });
        socket.on('spot_trade_history', (user_id) => {
            checkRoomOrJoin('spot_trade_history', socket, user_id);
            SpotTradeHistory(io.sockets, user_id);
        });
        socket.on('spot_funds', (user_id) => {
            checkRoomOrJoin('spot_funds', socket, user_id);
            SpotFunds(io.sockets, user_id);
        });

        socket.on('derivatives_wallet', (user_id) => {
            checkRoomOrJoin('derivatives_wallet', socket, user_id);
            DerivativesFunds(io.sockets, user_id);
        });
        /*
        socket.on('margin_cross_balance', (user_id) => {
            checkRoomOrJoin('margin_cross_balance',socket, user_id);
            GetCrossWallet( io.sockets, user_id);
        });
        socket.on('margin_isolated_balance', (user_id) => {
            checkRoomOrJoin('margin_isolated_balance',socket, user_id);
            GetIsolatedWallet( io.sockets, user_id);
        });
        socket.on('cross_open_orders', (user_id) => {
            checkRoomOrJoin('cross_open_orders',socket, user_id);
            CrossOpenOrders( io.sockets, user_id);
        });
        socket.on('cross_trade_history', (user_id) => {
            checkRoomOrJoin('cross_trade_history',socket, user_id);
            CrossTradeHistory( io.sockets, user_id);
        });
        socket.on('cross_order_history', (user_id) => {
            checkRoomOrJoin('cross_order_history',socket, user_id);
            CrossOrderHistory( io.sockets, user_id);
        });
        socket.on('cross_positions', (user_id) => {
            checkRoomOrJoin('cross_positions',socket, user_id);
            CrossPositions( io.sockets, user_id);
        });
        socket.on('cross_funds', (user_id) => {
            checkRoomOrJoin('cross_funds',socket, user_id);
            CrossFunds( io.sockets, user_id);
        });
        socket.on('isolated', (user_id) => {
            checkRoomOrJoin('isolated',socket, user_id);
            GetIsolatedWallet( io.sockets, user_id);
        });
        socket.on('isolated_open_orders', (user_id) => {
            checkRoomOrJoin('isolated_open_orders',socket, user_id);
            IsolatedOpenOrders( io.sockets, user_id);
        });
        socket.on('isolated_trade_history', (user_id) => {
            checkRoomOrJoin('isolated_open_orders',socket, user_id);
            IsolatedTradeHistory( io.sockets, user_id);
        });
        socket.on('isolated_order_history', (user_id) => {
            checkRoomOrJoin('isolated_open_orders',socket, user_id);
            IsolatedOrderHistory( io.sockets, user_id);
        });

        socket.on('isolated_positions', (user_id) => {
            checkRoomOrJoin('isolated_open_orders',socket, user_id);
            IsolatedPositions( io.sockets, user_id);
        });
        socket.on('isolated_funds', (user_id) => {
            checkRoomOrJoin('isolated_open_orders',socket, user_id);
            IsolatedFunds( io.sockets, user_id);
        });
        */
        socket.on('future_balance', (user_id) => {
            checkRoomOrJoin('future_balance', socket, user_id);
            GetFutureWallet(io.sockets, user_id);
        });
        socket.on('future_positions', (user_id) => {
            checkRoomOrJoin('future_positions', socket, user_id);
            FuturePositions(io.sockets, user_id);
        });
        socket.on('future_open_orders', (user_id) => {
            checkRoomOrJoin('future_open_orders', socket, user_id);
            FutureOpenOrders(io.sockets, user_id);
        });
        socket.on('future_order_history', (user_id) => {
            checkRoomOrJoin('future_order_history', socket, user_id);
            FutureOrderHistory(io.sockets, user_id);
        });
        socket.on('future_trade_history', (user_id) => {
            checkRoomOrJoin('future_trade_history', socket, user_id);
            FutureTradeHistory(io.sockets, user_id);
        });
        socket.on('future_transaction_history', (user_id) => {
            checkRoomOrJoin('future_transaction_history', socket, user_id);
            FutureTransactionHistory(io.sockets, user_id);
        });
        socket.on('future_assets', (user_id) => {
            checkRoomOrJoin('future_assets', socket, user_id);
            FutureAssets(io.sockets, user_id);
        });



        socket.on('leave', (id) => {
            SocketRoomsModel.deleteMany({ token: id });
            socket.leave(id);
        })


        function sendData(token, header, body) {
            io.sockets.in(token).emit(header, body);
        }

    });
}


global.MarketData = {};
async function fillMarketPrices() {

    let coinList = await CoinList.find({});

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
                global.MarketData[x.s] = { bid: x.b, ask: x.a };
            }
        }
    };
}

fillMarketPrices();

async function checkRoomOrJoin(process, socket, id) {
    if (id.indexOf('-') <= 0) return;
    let split = id.split('-');
    let uid = split[0];
    if (socket.rooms.has(id) == false) {
        socket.join(id);
    }

    let check = await SocketRoomsModel.findOne({ user_id: uid, token: id, process: process });
    if(check == null) {
        let save = new SocketRoomsModel({ user_id: uid, token: id, process: process });
        await save.save();
    }
}


server.listen(7011, () => {
    console.log("server is on")
});