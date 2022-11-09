const Orders = require("../../../models/Orders");

const SpotTradeHistory = async (ws, user_id) => {
    let orders = await Orders.find({
        user_id: user_id, type: 'market', $and:
            [
                { status: 0 },
            ]
    });
    ws.send(JSON.stringify({page:"spot", type: 'trade_history', content: orders }));

    Orders.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await Orders.find({
            user_id: user_id, type: 'market', $and:
                [
                    { status: 0 },
                ]
        });
        ws.send(JSON.stringify({ page:"spot",type: 'trade_history', content: orders }));
    });

}
module.exports = SpotTradeHistory;