const MarginOrder = require("../../../models/MarginOrder");

const CrossOpenOrders = async (ws, user_id) => {
    
    let orders = await MarginOrder.find({ user_id: user_id, status: {$gt : 0} });
    ws.send(JSON.stringify({ type: 'open_orders', content: orders }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, status: {$gt : 0} });
        ws.send(JSON.stringify({ type: 'open_orders', content: orders }));
    });

}
module.exports = CrossOpenOrders;