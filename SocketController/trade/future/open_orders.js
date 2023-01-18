const FutureOrder = require("../../../models/FutureOrder");

const FutureOpenOrders = async (sockets, user_id) => {
    let orders = await FutureOrder.find({ user_id: user_id, $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 });
    
    sockets.in(user_id).emit("future",{page:"future", type: 'open_orders', content: orders });
    FutureOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await FutureOrder.find({ user_id: user_id,  $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 });
        sockets.in(user_id).emit("future",{page:"future", type: 'open_orders', content: orders });
    });

}
module.exports = FutureOpenOrders;