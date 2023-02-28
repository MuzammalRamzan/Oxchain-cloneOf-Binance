const calculateFutureFund = require("../../../Functions/Future/calculateFutureFunds");
const CoinList = require("../../../models/CoinList");
const FutureOrder = require("../../../models/FutureOrder");
const FutureWalletModel = require("../../../models/FutureWalletModel");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");

const FutureAssets = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));

    let wallets = await FutureWalletModel.findOne({ user_id: user_id, status: 1 });
    let assets = await calculateFutureFund(wallets);
    
    var roomInUsers = await SocketRoomsModel.find({ token:token, process: "future_assets" });
    roomInUsers.forEach((room) => {
      sockets.in(room.token).emit("future_assets", assets);
    });
    
}

module.exports = FutureAssets;