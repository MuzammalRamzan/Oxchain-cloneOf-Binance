const http = require("http");
const https = require("https");
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

require("dotenv").config();

var server = null;
if (process.env.NODE_ENV == 'product') {
    server = https.createServer({
        key: fs.readFileSync('/etc/letsencrypt/live/socket.oxhain.com-0001/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/socket.oxhain.com-0001/cert.pem')
    });
} else {
    server = http.createServer();
}
const io = new socketio.Server(server, {
    cors: {
        origin: "*",
    }
});

io.on("connection", async (socket) => {
    await Connection.connection();
    socket.on('spot_open_orders', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        SpotOpenOrders(io.sockets, user_id);
    });
    socket.on('spot_order_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        SpotOrderHistory(io.sockets, user_id);
    });
    socket.on('spot_trade_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        SpotTradeHistory(io.sockets, user_id);
    });
    socket.on('spot_funds', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        SpotFunds(io.sockets, user_id);
    });
    socket.on('spot_assets', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        SpotFunds(io.sockets, user_id);
    });
    socket.on('derivatives_wallet', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        DerivativesFunds(io.sockets, user_id);
    });
    socket.on('cross', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        GetCrossWallet(io.sockets, user_id);
    });
    socket.on('cross_open_orders', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        CrossOpenOrders(io.sockets, user_id);
    });
    socket.on('cross_trade_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        CrossTradeHistory(io.sockets, user_id);
    });
    socket.on('cross_order_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        CrossOrderHistory(io.sockets, user_id);
    });
    socket.on('cross_positions', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        CrossPositions(io.sockets, user_id);
    });
    socket.on('cross_funds', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        CrossFunds(io.sockets, user_id);
    });
    socket.on('isolated', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        GetIsolatedWallet(io.sockets, user_id);
    });
    socket.on('isolated_open_orders', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        IsolatedOpenOrders(io.sockets, user_id);
    });
    socket.on('isolated_trade_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        IsolatedTradeHistory(io.sockets, user_id);
    });
    socket.on('isolated_order_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        IsolatedOrderHistory(io.sockets, user_id);
    });

    socket.on('isolated_positions', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        IsolatedPositions(io.sockets, user_id);
    });
    socket.on('isolated_funds', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        IsolatedFunds(io.sockets, user_id);
    });


    socket.on('future_balance', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        GetFutureWallet(io.sockets, user_id);
    });
    socket.on('future_positions', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        FuturePositions(io.sockets, user_id);
    });
    socket.on('future_open_orders', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        FutureOpenOrders(io.sockets, user_id);
    });
    socket.on('future_order_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        FutureOrderHistory(io.sockets, user_id);
    });
    socket.on('future_trade_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        FutureTradeHistory(io.sockets, user_id);
    });
    socket.on('future_transaction_history', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        FutureTransactionHistory(io.sockets, user_id);
    });
    socket.on('future_assets', (user_id) => {
        checkRoomOrJoin(socket, user_id);
        FutureAssets(io.sockets, user_id);
    });



    function sendData(token, header, body) {
        io.sockets.in(token).emit(header, body);
    }

});



function checkRoomOrJoin(socket, id) {
    if (socket.rooms.has(id) == false) {
        socket.join(id);
    }
    console.log(socket.rooms);
}


server.listen(7011, () => {
    console.log("server is on")
});