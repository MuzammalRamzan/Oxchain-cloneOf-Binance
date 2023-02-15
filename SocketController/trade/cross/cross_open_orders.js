const MarginOrder = require("../../../models/MarginOrder");

const CrossOpenOrders = async (sockets, user_id) => {
    
    let orders = await MarginOrder.find({ user_id: user_id, margin_type: "cross", $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 });
    
    sockets.in(user_id).emit("cross_open_orders", {page:"cross", type: 'open_orders', content: orders });
    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type: "cross", $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 });
        sockets.in(user_id).emit("cross_open_orders", {page:"cross", type: 'open_orders', content: orders });
    });

}
module.exports = CrossOpenOrders;