const GetFutureLiqPrice = require("../../../Functions/Future/getFutureLiqPrice");
const FutureOrder = require("../../../models/FutureOrder");
const FutureWalletModel = require("../../../models/FutureWalletModel");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");
const MarginWalletId = "62ff3c742bebf06a81be98fd";


const FuturePositions = async (sockets, user_id) => {
  let token = user_id;
  user_id = user_id.substring(0, user_id.indexOf('-'));
  let orders = await FutureOrder.find({
    user_id: user_id,
    method: "market",
    status: 0,
  });
  let assets = await GetFutureLiqPrice(orders);
  
    
  var roomInUsers = await SocketRoomsModel.find({ token:token, process: "future_positions" });
  roomInUsers.forEach((room) => {
    sockets.in(room.token).emit("future_positions", { page: "future", type: "positions", content: assets });
  });

};

module.exports = FuturePositions;
