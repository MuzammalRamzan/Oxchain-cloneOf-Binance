const MarginOrder = require("../../../models/MarginOrder");

const CrossPositions = async (sockets, user_id) => {

    let orders = await MarginOrder.find({ user_id: user_id, margin_type: "cross", method: 'market', status: 0 });
    let assets = await calculate(orders);
    sockets.in(user_id).emit("cross_positions", { page: "cross", type: 'positions', content: assets });

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type: "cross", method: 'market', status: 0 });
        let assets = await calculate(orders);
        
        sockets.in(user_id).emit("cross_positions", { page: "cross", type: 'positions', content: assets });
    });

}
async function calculate(orders) {
    let assets = [];
    for (var i = 0; i < orders.length; i++) {
        let order = orders[i];
        
        let marketData = await axios("http://global.oxhain.com:8542/price?symbol="+order.pair_name);
        marketData = marketData.data.data;
        if (marketData == null || marketData == 'undefined') {
        } else {
            if (order.type == 'buy') {
                assets.push({ "symbol": order.pair_name, "position": order.amount, "position_value": (marketData.ask * order.amount), "index_price": marketData.ask, "liqPrice": '/', 'toLiqPrice': '/' });
            } else if (order.type == 'sell') {
                assets.push({ "symbol": order.pair_name, "position": order.amount, "position_value": (marketData.bid * order.amount), "index_price": marketData.ask, "liqPrice": '/', 'toLiqPrice': '/' });
            }
        }
    }
    return assets;
}
module.exports = CrossPositions;