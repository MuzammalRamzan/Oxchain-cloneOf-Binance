const FutureOrder = require("../../../models/FutureOrder");
const MarginOrder = require("../../../models/MarginOrder");

const FutureTradeHistory = async (sockets, user_id) => {

    let request = { user_id: user_id, method: "market" };
    /*
    if (filter['symbol'] != null) {
        console.log(filter['symbol'])
        request['pair_name'] = filter['symbol'];
    }

    if ((filter['side'] != null)) {
        if (filter['side'] != 'all')
            request['type'] = filter['side'];
    }


    if (filter['date_from'] != null && filter['date_to'] != null) {
        request['createdAt'] = { $gte: filter['date_from'], $lt: filter['date_to'] };
    }

    */
   
    let orders = await FutureOrder.find(request);
    let assets = FillTable(orders);
    
    sockets.in(user_id).emit("future_trade_history",{ page: "future", type: 'trade_history', content: assets });
    FutureOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await FutureOrder.find(request);
        let assets = FillTable(orders);
        sockets.in(user_id).emit("future_trade_history",{ page: "future", type: 'trade_history', content: assets });
    });

}

function FillTable(orders) {
    let assets = [];
    for (var i = 0; i < orders.length; i++) {
        let order = orders[i];
        assets.push({ "symbol": order.pair_name, "side": order.type, "price": order.open_price, "quantity": order.usedUSDT, "role": "Taker", "realized_profit": order.pnl, "createdAt": order.createdAt });
    }
    return assets;
}
module.exports = FutureTradeHistory;