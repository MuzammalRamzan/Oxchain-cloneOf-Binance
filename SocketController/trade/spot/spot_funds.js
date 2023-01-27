const CoinList = require("../../../models/CoinList");
const MarginOrder = require("../../../models/MarginOrder");
const Wallet = require("../../../models/Wallet")
const CoinListModel = require("../../../models/CoinList");
const axios = require("axios");



const SpotFunds = async (sockets, user_id) => {

    let CoinListFind = await CoinListModel.find({});
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
    let assets = await calculate(wallets);
    sockets.in(user_id).emit("spot", { page: "spot", type: 'funds', content: assets });
    

    Wallet.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await Wallet.find({ user_id: user_id, status: 1 });
        let assets = await calculate(wallets);
        sockets.in(user_id).emit("spot", { page: "spot", type: 'funds', content: assets });
    });
}

async function calculate(wallets) {
    let assets = [];
    for (var i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });


        let btcPrice = 0;
        let usdtPrice = 0;


        let amountData = wallet.amount;

        
        if (coinInfo.symbol == "BTC") {
            btcPrice = amountData;
            usdtPrice = amountData * global.MarketData["BTCUSDT"];
        }
        else {
            btcPrice = amountData * global.MarketData[coinInfo.symbol + "USDT"] / global.MarketData["BTCUSDT"];
            usdtPrice = amountData * global.MarketData[coinInfo.symbol + "USDT"];
        }


        assets.push(
            {
                "symbol": coinInfo.symbol,
                "totalBalance": wallet.amount,
                "availableBalance": wallet.amount,
                "name": coinInfo.name,
                "icon": coinInfo.image_url,
                'inOrder': 0.00,
                'btcValue': btcPrice,
                'usdtValue': usdtPrice,
                'coin_id': coinInfo._id,
            }
        );
    }
    return assets;
}
module.exports = SpotFunds;