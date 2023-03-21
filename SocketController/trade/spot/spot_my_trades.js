const Orders = require("../../../models/Orders");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const SpotMyTrades = async (sockets, user_id, pair_name) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let orders = await Orders.find({ user_id: user_id, pair_name:pair_name ,type : 'market'}).select('amount method open_price createdAt').sort({createdAt : -1});
    
    var roomInUsers = await SocketRoomsModel.find({ token:token, process: "spot_my_trades" });
    roomInUsers.forEach((room) => {
      sockets.in(room.token).emit("spot_my_trades", {page:"spot", type: 'my_trades', content: orders });
    });
}
module.exports = SpotMyTrades;