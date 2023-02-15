const MarginOrder = require("../../../models/MarginOrder");

const IsolatedTradeHistory = async (sockets, user_id) => {
 
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated" });
    
    sockets.in(user_id).emit("isolated_trade_history",{page:"isolated", type: 'trade_history', content: orders });
    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated"});
        sockets.in(user_id).emit("isolated_trade_history",{page:"isolated", type: 'trade_history', content: orders });
    });

}
module.exports = IsolatedTradeHistory;