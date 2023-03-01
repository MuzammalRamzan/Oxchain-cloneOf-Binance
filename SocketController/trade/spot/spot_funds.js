const CoinList = require("../../../models/CoinList");
const MarginOrder = require("../../../models/MarginOrder");
const Wallet = require("../../../models/Wallet")
const CoinListModel = require("../../../models/CoinList");
const axios = require("axios");
const SpotFundsCalculate = require("../../../Functions/Spot/SpotFundsCalculate");
const SocketRoomsModel = require("../../../models/SocketRoomsModel");



const SpotFunds = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));

    /*
        let prices = [];
        for (var i = 0; i < CoinListFind.length; i++) {
            let coinInfo = CoinListFind[i];
            if (coinInfo.symbol == "USDT") continue;
            if (coinInfo.symbol == "Margin") continue;
            if (coinInfo.symbol == "SHIBA") {
                coinInfo.symbol = "SHIB";
            }
            let findBinanceItem = await axios("https://api.binance.com/api/v3/ticker/price?symbol=" + coinInfo.symbol + "USDT");
    
            //create a price object
            prices[coinInfo.symbol] = global.MarketData[coinInfo.symbol];
        }
        */



    let wallets = await Wallet.find({ user_id: user_id, status: 1 });
    let assets = await SpotFundsCalculate(wallets);


    var roomInUsers = await SocketRoomsModel.find({ token: token, process: "spot_funds" });
    roomInUsers.forEach((room) => {
        sockets.in(room.token).emit("spot_funds", { page: "spot", type: 'funds', content: assets });
    })

}

module.exports = SpotFunds;