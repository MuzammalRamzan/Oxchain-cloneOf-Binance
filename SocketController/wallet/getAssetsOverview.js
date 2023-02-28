const { default: axios } = require("axios");
const FutureAssetsOverviewCalculate = require("../../Functions/Future/assetsOverviewCalculate");
const SpotAssetsOverviewCalculate = require("../../Functions/Spot/SpotAssetsOverviewCalculate");

const CoinList = require("../../models/CoinList");
const FutureWalletModel = require("../../models/FutureWalletModel");
const SocketRoomsModel = require("../../models/SocketRoomsModel");
const Wallet = require("../../models/Wallet");

const GetAssetsOverView = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let wallets = await Wallet.find({ user_id: user_id, status: 1 });
    let spotAssets = await SpotAssetsOverviewCalculate(wallets);

    let futureData = await FutureAssetsOverviewCalculate(user_id);

    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "assets_overview" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("assets_overview", {
            "spot": spotAssets,
            "future": futureData
        });
    });


}



module.exports = GetAssetsOverView;