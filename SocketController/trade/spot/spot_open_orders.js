const Orders = require("../../../models/Orders");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const SpotOpenOrders = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let orders = await Orders.find({ user_id: user_id, $or: [{ type: 'limit' }, { type: 'stop_limit' },], status: 1 });
    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "spot_open_orders" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("spot_open_orders", { type: 'open_orders', content: orders });
    })



}
module.exports = SpotOpenOrders;