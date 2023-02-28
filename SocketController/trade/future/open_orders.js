const FutureOrder = require("../../../models/FutureOrder");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const FutureOpenOrders = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let orders = await FutureOrder.find({ user_id: user_id, $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 });
    
    sockets.in(user_id).emit("future",{page:"future", type: 'open_orders', content: orders });
    FutureOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await FutureOrder.find({ user_id: user_id,  $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 });
        sockets.in(user_id).emit("future",{page:"future", type: 'open_orders', content: orders });
    });
    

    var roomInUsers = await SocketRoomsModel.find({ token:token, process: "future_open_orders" });
    roomInUsers.forEach((room) => {
      sockets.in(room.token).emit("future_open_orders", {page:"future", type: 'open_orders', content: orders });
    });

}
module.exports = FutureOpenOrders;