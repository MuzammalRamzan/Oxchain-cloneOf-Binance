const Orders = require("../../../models/Orders");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const SpotOrderHistory = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
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
    
    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "spot_order_history" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("spot_order_history", { page: "spot", type: 'order_history', content: orders });
    })

}
module.exports = SpotOrderHistory;