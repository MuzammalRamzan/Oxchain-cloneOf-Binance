const MarginOrder = require("../../../models/MarginOrder");

const CrossOrderHistory = async (ws, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross", method: "limit" });
    ws.send(JSON.stringify({page:"cross", type: 'open_orders', content: orders }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross", method: "limit" });
        ws.send(JSON.stringify({page:"cross", type: 'open_orders', content: orders }));
    });

}
module.exports = CrossOrderHistory;