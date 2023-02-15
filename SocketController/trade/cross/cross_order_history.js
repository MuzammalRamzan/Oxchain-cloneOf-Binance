const MarginOrder = require("../../../models/MarginOrder");

const CrossOrderHistory = async (sockets, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross", $or: [{method: "limit"}, {method: "stop_limit"}] });
    sockets.in(user_id).emit("cross_order_history", {page:"cross", type: 'order_history', content: orders });

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross", $or: [{method: "limit"}, {method: "stop_limit"}] });
        sockets.in(user_id).emit("cross_order_history", {page:"cross", type: 'order_history', content: orders });
    });

}
module.exports = CrossOrderHistory;