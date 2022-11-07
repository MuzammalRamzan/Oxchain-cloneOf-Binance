const Orders = require("../../../models/Orders");

const SpotOpenOrders = async (ws, user_id) => {
    let orders = await Orders.find({ user_id: user_id, type: 'limit', status: 1 });
    ws.send(JSON.stringify({ type: 'open_orders', content: orders }));

    Orders.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await Orders.find({ user_id: user_id, type: 'limit', status: 1 });
        ws.send(JSON.stringify({ type: 'open_orders', content: orders }));
    });

}
module.exports = SpotOpenOrders;