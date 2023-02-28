
const TradeHistoryFillTable = require("../../../Functions/Future/tradeHistoryFillTable");
const FutureOrder = require("../../../models/FutureOrder");
const MarginOrder = require("../../../models/MarginOrder");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const FutureTradeHistory = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let request = { user_id: user_id, method: "market" };
    /*
    if (filter['symbol'] != null) {
        console.log(filter['symbol'])
        request['pair_name'] = filter['symbol'];
    }

    if ((filter['side'] != null)) {
        if (filter['side'] != 'all')
            request['type'] = filter['side'];
    }


    if (filter['date_from'] != null && filter['date_to'] != null) {
        request['createdAt'] = { $gte: filter['date_from'], $lt: filter['date_to'] };
    }

    */

    let orders = await FutureOrder.find(request);
    let assets = TradeHistoryFillTable(orders);


    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "future_trade_history" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("future_trade_history", assets);
    });



}


module.exports = FutureTradeHistory;