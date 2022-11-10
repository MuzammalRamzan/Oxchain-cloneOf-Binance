const MarginOrder = require("../../../models/MarginOrder");

const CrossTradeHistory = async (ws, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross" });
    ws.send(JSON.stringify({page:"cross", type: 'trade_history', content: orders }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross"});
        ws.send(JSON.stringify({page:"cross", type: 'trade_history', content: orders }));
    });

}
module.exports = CrossTradeHistory;