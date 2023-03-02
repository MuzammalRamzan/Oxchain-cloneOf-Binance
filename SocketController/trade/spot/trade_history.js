const Orders = require("../../../models/Orders");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const SpotTradeHistory = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let orders = await Orders.find({
        user_id: user_id, type: 'market', $and:
            [
                { status: 0 },
            ]
    });

    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "spot_trade_history" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("spot_trade_history", {page:"spot", type: 'trade_history', content: orders });
    });

}
module.exports = SpotTradeHistory;