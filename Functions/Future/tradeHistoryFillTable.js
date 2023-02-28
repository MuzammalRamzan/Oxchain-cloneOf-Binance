function TradeHistoryFillTable(orders) {
    let assets = [];
    for (var i = 0; i < orders.length; i++) {
        let order = orders[i];
        assets.push({ "symbol": order.pair_name, "side": order.type, "price": order.open_price, "quantity": order.usedUSDT, "role": "Taker", "realized_profit": order.pnl, "createdAt": order.createdAt });
    }
    return assets;
}
module.exports = TradeHistoryFillTable;