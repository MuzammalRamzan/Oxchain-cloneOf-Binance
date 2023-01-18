const MarginOrder = require("../../../models/MarginOrder");

const IsolatedOpenOrders = async (sockets, user_id) => {
    
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated", method: 'market', status: 0 });
    sockets.in(user_id).emit("isolated",{ page:"isolated", type: 'open_orders', content: orders });

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated", method: 'market', status: 0 });
        ws.send(JSON.stringify());
        sockets.in(user_id).emit("isolated",{ page:"isolated", type: 'open_orders', content: orders });
    });

}
module.exports = IsolatedOpenOrders;