const SpotWalletJoin = require("../../Functions/Spot/SpotWalletJoin");
const Pairs = require("../../models/Pairs");
const SocketRoomsModel = require("../../models/SocketRoomsModel");
const Wallet = require("../../models/Wallet")

const GetSpotWallet = async (sockets, user_id) => {
  let token = user_id;
  user_id = user_id.substring(0, user_id.indexOf('-'));
  let wallet = await Wallet.find({ user_id: user_id }).exec();
  let assets = await SpotWalletJoin(wallet);


  var roomInUsers = await SocketRoomsModel.find({ token:token, process: "wallets" });
  roomInUsers.forEach((room) => {
    sockets.in(room.token).emit("wallets", assets);
  })



}



module.exports = GetSpotWallet;