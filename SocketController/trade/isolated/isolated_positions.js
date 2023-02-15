const MarginOrder = require("../../../models/MarginOrder");

const IsolatedPositions = async (sockets, user_id) => {
    
    let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated",  $or: [{method: "limit"}, {method: "stop_limit"}] ,status: 1 });
    
    sockets.in(user_id).emit("isolated_positions",{page:"isolated", type: 'positions', content: orders });
    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await MarginOrder.find({ user_id: user_id, margin_type:"isolated",  $or: [{method: "limit"}, {method: "stop_limit"}] ,status: 1 });
        
        sockets.in(user_id).emit("isolated_positions",{page:"isolated", type: 'positions', content: orders });
    });

}
module.exports = IsolatedPositions;