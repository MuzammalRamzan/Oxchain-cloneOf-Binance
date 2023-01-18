const Orders = require("../../../models/Orders");

const SpotOrderHistory = async (sockets, user_id) => {
    let orders = await Orders.find({
        user_id: user_id, $or: [
            {
                user_id: user_id,
                type: 'limit'
            },
            {
                user_id: user_id,
                type: 'stop_limit'
            },


        ]
    });
    
    sockets.in(user_id).emit("spot", { page: "spot", type: 'order_history', content: orders });
    Orders.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {

        let orders = await Orders.find({
             $or: [
                {
                    user_id: user_id,
                    type: 'limit'
                },
                {
                    user_id: user_id,
                    type: 'stop_limit'
                },


            ]
        });
        sockets.in(user_id).emit("spot", { page: "spot", type: 'order_history', content: orders });
        
    });

}
module.exports = SpotOrderHistory;