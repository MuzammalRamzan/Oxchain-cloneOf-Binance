const { default: axios } = require("axios");
const CoinList = require("../../models/CoinList");

async function SpotAssetsCalculate(wallets) {
    try {
        let coinList = await CoinList.find({});

        let totalBtcValue = 0.0;
        let totalUsdValue = 0.0;
        //let priceData = await axios("http://global.oxhain.com:8542/price?symbol=BTCUSDT");
        let priceData = global.MarketData["BTCUSDT"];
        let btcPrice = priceData.ask;
        let walletData = {};

        wallets.forEach(async (key, value) => {

            let getCoinInfo = coinList.filter((x) => x._id == key.coin_id)[0];
            walletData[getCoinInfo.symbol] = {
                id: getCoinInfo.id,
                symbol: getCoinInfo.symbol,
                name: getCoinInfo.name,
                network: getCoinInfo.network,
                icon: getCoinInfo.image_url,
                balance: 0.0,
                amount: key.amount,
            };
        });
        totalUsdValue = 0.0;
        totalBtcValue = 0.0;
        for (var value in walletData) {
            if (value == "Margin") {
                walletData[value].balance = walletData[value].amount;
                totalUsdValue += walletData[value].amount;
            } else if (value == "USDT") {
                walletData[value].balance = walletData[value].amount;
                totalUsdValue += walletData[value].amount;
            } else {
                //priceData = await axios("http://global.oxhain.com:8542/price?symbol=" + value + "USDT");
                priceData = global.MarketData[value + "USDT"].ask
                let price = priceData;

                if (price > 0) {
                    walletData[value].balance =
                        parseFloat(walletData[value].amount) * price;
                    totalUsdValue +=
                        parseFloat(walletData[value].amount) * price;
                }
            }
        }
        totalBtcValue = totalUsdValue / btcPrice;

        return {
            wallets: walletData,
            totalUSD: totalUsdValue,
            totalBTC: totalBtcValue,
        };
        /*
        sockets.in(user_id).emit("assets", {
            page: "assets", type: 'assets', content: {
                wallets: walletData,
                totalUSD: totalUsdValue,
                totalBTC: totalBtcValue,
            }
        }); 
        */
    } catch (err) {
        
    }
    return {
        wallets: 0,
        totalUSD: 0,
        totalBTC: 0,
    }
}

module.exports = SpotAssetsCalculate;