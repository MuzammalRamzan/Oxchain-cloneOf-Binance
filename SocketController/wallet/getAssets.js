const { default: axios } = require("axios");
const SpotAssetsCalculate = require("../../Functions/Spot/SpotAssetsCalculate");
const CoinList = require("../../models/CoinList");
const SocketRoomsModel = require("../../models/SocketRoomsModel");
const Wallet = require("../../models/Wallet");

const GetAssets = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let wallets = await Wallet.find({ user_id: user_id, status: 1 });
    let assets = await SpotAssetsCalculate(wallets);

   
  var roomInUsers = await SocketRoomsModel.find({ token:token, process: "assets" });
  roomInUsers.forEach((room) => {
    sockets.in(room.token).emit("assets", assets);
  });

}

module.exports = GetAssets;