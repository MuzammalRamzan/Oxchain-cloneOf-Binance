const SocketRoomsModel = require("../../../models/SocketRoomsModel");
const Transactions = require("../../../models/Transactions");

const FutureTransactionHistory = async (sockets, user_id, filter) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let request = { user_id: user_id };

    /*
    if (filter['type'] != null) {
        if (filter['type'] != 'all')
            request["type"] = filter['type'];
    }

    if (filter['date_from'] != null && filter['date_to'] != null) {
        request['createdAt'] = { $gte: filter['date_from'], $lt: filter['date_to'] };
    }
    */

    let table = await Transactions.find(request);
    
    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "future_transaction_history" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("future_transaction_history", table);
    });
}
module.exports = FutureTransactionHistory;