const MarginOrder = require("../../../models/MarginOrder");

const IsolatedTradeHistory = async (ws, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated" });
    ws.send(JSON.stringify({page:"isolated", type: 'trade_history', content: orders }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated"});
        ws.send(JSON.stringify({page:"isolated", type: 'trade_history', content: orders }));
    });

}
module.exports = IsolatedTradeHistory;