const MarginOrder = require("../../../models/MarginOrder");

const IsolatedOrderHistory = async (sockets, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated", $or: [{method: "limit"}, {method: "stop_limit"}]});
    
    sockets.in(user_id).emit("isolated_order_history",{page:"isolated", type: 'order_history', content: orders });
    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated", $or: [{method: "limit"}, {method: "stop_limit"}]});
        sockets.in(user_id).emit("isolated_order_history",{page:"isolated", type: 'order_history', content: orders });
    });

}
module.exports = IsolatedOrderHistory;