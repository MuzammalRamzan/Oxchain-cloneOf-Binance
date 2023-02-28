const calculateFutureBalance = require("../../Functions/Future/calculateFutureBalance");
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");
const SocketRoomsModel = require("../../models/SocketRoomsModel");

const GetFutureWallet = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let wallet = await FutureWalletModel.findOne({user_id: user_id});
    let balance = await calculateFutureBalance(wallet);
    
    var roomInUsers = await SocketRoomsModel.find({ token:token, process: "future_balance" });
    roomInUsers.forEach((room) => {
      sockets.in(room.token).emit("future_balance", { type: "future_balance", content: balance });
    });
}


module.exports = GetFutureWallet;