const FutureOrder = require("../../../models/FutureOrder");
const MarginOrder = require("../../../models/MarginOrder");

const FutureTradeHistory = async (ws, user_id) => {

    let orders = await FutureOrder.find({ user_id: user_id, margin_type: "cross" });
    let assets = FillTable(orders); 
    ws.send(JSON.stringify({ page: "future", type: 'trade_history', content: assets }));

    FutureOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await FutureOrder.find({ user_id: user_id, margin_type: "cross" });
        let assets = FillTable(orders); 
        ws.send(JSON.stringify({ page: "future", type: 'trade_history', content: assets }));
    });

}

 function FillTable(orders) {
    let assets = [];
    for (var i = 0; i < orders.length; i++) {
        let order = orders[i];
        assets.push({ "symbol": order.pair_name, "side": order.type, "price": order.open_price, "quantity": order.usedUSDT, "role": "Taker", "realized_profit": order.pnl });
    }
    return assets;
}
module.exports = FutureTradeHistory;