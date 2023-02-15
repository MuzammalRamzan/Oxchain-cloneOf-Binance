const { default: axios } = require("axios");
const Pairs = require("../../models/Pairs");

var authFile = require("../../auth.js");

const Calculate = async (req, res) => {

    var api_key_result = req.body.api_key;

    var result = await authFile.apiKeyChecker(api_key_result);

    if (result != true) {
        return res.json({ status: "fail", message: "api_key_not_valid", showableMessage: "Api key not valid" });
    }


    let binanceData = await axios.get("http://global.oxhain.com:8542/24hr");

    let PairsData = await Pairs.find({});

    //get max trending from binance api which is listed on Pairs
    let trendingCoinsArray = [];
    let maxVolumesArray = [];
    let maxLossesArray = [];
    let maxGainsArray = [];
    let newestCoinsArray = [];



    PairsData.forEach(coin => {
        binanceData.data.forEach(binanceCoin => {
            if (coin.name.replace("/", "") === binanceCoin.symbol) {

                trendingCoinsArray.push({
                    name: coin.name,
                    priceChangePercent: binanceCoin.priceChangePercent,
                    priceChange: binanceCoin.priceChange,
                    lastPrice: binanceCoin.lastPrice,
                    volume: binanceCoin.volume,
                    quoteVolume: binanceCoin.quoteVolume,
                    openPrice: binanceCoin.openPrice,
                    highPrice: binanceCoin.highPrice,
                    lowPrice: binanceCoin.lowPrice,
                    closeTime: binanceCoin.closeTime,
                });

                maxVolumesArray.push({
                    name: coin.name,
                    volume: binanceCoin.volume,
                    quoteVolume: binanceCoin.quoteVolume,
                });

                maxLossesArray.push({
                    name: coin.name,
                    priceChangePercent: binanceCoin.priceChangePercent,
                    priceChange: binanceCoin.priceChange,
                });

                maxGainsArray.push({
                    name: coin.name,
                    priceChangePercent: binanceCoin.priceChangePercent,
                    priceChange: binanceCoin.priceChange,
                });

                newestCoinsArray.push({
                    name: coin.name,
                    createdAt: coin.createdAt,
                    priceChangePercent: binanceCoin.priceChangePercent,
                    priceChange: binanceCoin.priceChange,
                    lastPrice: binanceCoin.lastPrice,
                });
            }
        })
    });


    //change the array direction to descending by priceChangePercent
    trendingCoinsArray.sort((a, b) => {
        return b.priceChangePercent - a.priceChangePercent;
    });


    //change the array direction to descending by volume
    maxVolumesArray.sort((a, b) => {
        return b.volume - a.volume;
    });

    //change the array direction to descending by priceChangePercent
    maxLossesArray.sort((a, b) => {
        return a.priceChangePercent - b.priceChangePercent;
    });

    //change the array direction to descending by priceChangePercent
    maxGainsArray.sort((a, b) => {
        return b.priceChangePercent - a.priceChangePercent;
    });

    //change the array direction to descending by createdAt
    newestCoinsArray.sort((a, b) => {
        return b.createdAt - a.createdAt;
    });

    return res.json({
        status: "success",
        trendingCoins: trendingCoinsArray,
        maxVolumes: maxVolumesArray,
        maxLosses: maxLossesArray,
        maxGains: maxGainsArray,
        newestCoins: newestCoinsArray,

    });

}

module.exports = Calculate;