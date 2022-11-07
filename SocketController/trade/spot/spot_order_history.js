const Orders = require("../../../models/Orders");

const SpotOrderHistory = async (ws, user_id) => {
    let orders = await Orders.find({
        user_id: user_id, type: 'limit', $or:
            [
                { status: -2 },
                { status: -1 },
                { status: 0 },
            ]
    });
    ws.send(JSON.stringify({ type: 'order_history', content: orders }));
    Orders.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        console.log("fa");
        let orders = await Orders.find({
            user_id: user_id, type: 'limit', $or:
                [
                    { status: -2 },
                    { status: -1 },
                    { status: 0 },
                ]
        });
        ws.send(JSON.stringify({ type: 'order_history', content: orders }));
    });

}
module.exports = SpotOrderHistory;