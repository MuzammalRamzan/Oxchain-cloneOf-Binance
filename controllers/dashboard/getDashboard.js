const { default: axios } = require("axios");
const CoinList = require("../../models/CoinList");


const Calculate = async (req, res) => {


    //get trending coins from binance api which is listed on CoinList
    let coinList = await CoinList.find({}).exec();
    let coinListArray = [];
    coinList.forEach(coin => {
        coinListArray.push(coin.symbol);
    }
    );

    let trendingCoins = await axios.get("https://api.binance.com/api/v3/ticker/24hr");
    let trendingCoinsArray = [];
    trendingCoins.data.forEach(coin => {
        if (coinListArray.includes(coin.symbol)) {
            trendingCoinsArray.push(coin);
        }
    }
    );

    //get max volumes from binance api which is listed on CoinList
    let maxVolumes = await axios.get("https://api.binance.com/api/v3/ticker/24hr");
    let maxVolumesArray = [];
    maxVolumes.data.forEach(coin => {
        if (coinListArray.includes(coin.symbol)) {
            maxVolumesArray.push(coin);
        }
    }
    );

    //get max losses from binance api which is listed on CoinList
    let maxLosses = await axios.get("https://api.binance.com/api/v3/ticker/24hr");
    let maxLossesArray = [];
    maxLosses.data.forEach(coin => {
        if (coinListArray.includes(coin.symbol)) {
            maxLossesArray.push(coin);
        }
    }
    );

    //get max gains from binance api which is listed on CoinList
    let maxGains = await axios.get("https://api.binance.com/api/v3/ticker/24hr");
    let maxGainsArray = [];
    maxGains.data.forEach(coin => {
        if (coinListArray.includes(coin.symbol)) {
            maxGainsArray.push(coin);
        }
    }
    );

    return res.json({
        status: "success",
        trendingCoins: trendingCoinsArray,
        maxVolumes: maxVolumesArray,
        maxLosses: maxLossesArray,
        maxGains: maxGainsArray
    });

}

module.exports = Calculate;