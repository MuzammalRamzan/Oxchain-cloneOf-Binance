const MarginOrder = require("../../../models/MarginOrder");

const IsolatedOrderHistory = async (ws, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated", $or: [{method: "limit"}, {method: "stop_limit"}]});
    ws.send(JSON.stringify({page:"isolated", type: 'order_history', content: orders }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated", $or: [{method: "limit"}, {method: "stop_limit"}]});
        ws.send(JSON.stringify({page:"isolated", type: 'order_history', content: orders }));
    });

}
module.exports = IsolatedOrderHistory;