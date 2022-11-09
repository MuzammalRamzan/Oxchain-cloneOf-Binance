const MarginOrder = require("../../../models/MarginOrder");

const CrossPositions = async (ws, user_id) => {
    
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross",  method: "limit" ,status: 1 });
    ws.send(JSON.stringify({page:"cross", type: 'positions', content: orders }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"cross",  method: "limit" ,status: 1 });
        ws.send(JSON.stringify({page:"cross", type: 'positions', content: orders }));
    });

}
module.exports = CrossPositions;