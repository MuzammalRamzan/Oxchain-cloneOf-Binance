const MarginOrder = require("../../../models/MarginOrder");

const CrossOrderHistory = async (ws, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross", $or: [{method: "limit"}, {method: "stop_limit"}] });
    ws.send(JSON.stringify({page:"cross", type: 'order_history', content: orders }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross", $or: [{method: "limit"}, {method: "stop_limit"}] });
        ws.send(JSON.stringify({page:"cross", type: 'order_history', content: orders }));
    });

}
module.exports = CrossOrderHistory;