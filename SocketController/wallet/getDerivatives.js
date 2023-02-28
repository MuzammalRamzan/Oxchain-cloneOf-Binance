const { default: axios } = require("axios");
const DerivativesCalculate = require("../../Functions/derivativesCalculate");
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");
const SocketRoomsModel = require("../../models/SocketRoomsModel");

const GetDerivatives = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let wallet = await FutureWalletModel.findOne({ user_id: user_id });

    let assets = await DerivativesCalculate(wallet);
    sockets.in(user_id).emit("derivatives", assets);

    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "derivatives" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("derivatives", assets);
    });

}


module.exports = GetDerivatives;