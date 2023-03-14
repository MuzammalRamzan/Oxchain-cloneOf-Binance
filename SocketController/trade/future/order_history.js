const FutureOrder = require("../../../models/FutureOrder");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const FutureOrderHistory = async (sockets, user_id, filter) => {
    let request = { user_id: user_id };
    /*
    if (filter['symbol'] != null) {
        request['pair_name'] = filter['symbol'];
    }

    if (filter['type'] == 'all' || filter['type'] == null) {
        request["$or"] = [{ method: "limit" }, { method: "stop_limit" }];
    } else {
        request['method'] = filter['type'];
    }

    if ((filter['side'] != null)) {
        if (filter['side'] != 'all')
            request['type'] = filter['side'];
    }

    let status = [];
    if (filter['cancelled'] != null) {
        status.push({ status: -1 });
    }
    if (filter['filled'] != null) {
        status.push({ status: 0 });
    }
    if (status.length > 0)
        request['$or'] = status;

    if(filter['date_from'] != null && filter['date_to'] != null) {
        request['createdAt'] = {$gte : filter['date_from'], $lt : filter['date_to']};
    }

    */
   
    let orders = await FutureOrder.find(request);
    var roomInUsers = await SocketRoomsModel.find({ token: tkn, process: "future_order_history" }).exec();
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("future_order_history", { page: "future", type: 'order_history', content: orders });
    });

}
module.exports = FutureOrderHistory;