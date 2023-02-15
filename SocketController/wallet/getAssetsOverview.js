const { default: axios } = require("axios");
const CoinList = require("../../models/CoinList");
const FutureWalletModel = require("../../models/FutureWalletModel");
const Wallet = require("../../models/Wallet");

const GetAssetsOverView = async (sockets, user_id) => {

    let wallets = await Wallet.find({ user_id: user_id, status: 1 });
    let spotAssets = await calculateSpot(wallets);

    let futureData = await calculateFuture(user_id);
        sockets.in(user_id).emit("assets_overview", {
            "spot": spotAssets,
            "future": futureData
        });

    Wallet.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await Wallet.find({ user_id: user_id, status: 1 });
        let spotData = await calculateSpot( wallets);
        let futureData = await calculateFuture(user_id);
        sockets.in(user_id).emit("assets_overview", {
            "spot": spotData,
            "future": futureData
        });
    });


    
}

async function calculateFuture(user_id) {
    let future = await FutureWalletModel.findOne({ user_id: user_id });
    let priceData = await axios("http://18.170.26.150:8542/price?symbol=BTCUSDT");
    let btcPrice = priceData.data.data.ask;
    let btcValue = future.amount / btcPrice;
    return {
        totalUSD: future.amount,
        totalBTC: btcValue,
    }
}

async function calculateSpot(wallets) {
    try {
        let coinList = await CoinList.find({});

        let totalBtcValue = 0.0;
        let totalUsdValue = 0.0;
        let priceData = await axios("http://18.170.26.150:8542/price?symbol=BTCUSDT");
        let btcPrice = priceData.data.data.ask;
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
                priceData = await axios("http://18.170.26.150:8542/price?symbol=" + value + "USDT");
                let price = priceData.data.data.ask;

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
            totalUSD: totalUsdValue,
            totalBTC: totalBtcValue,
        };
    } catch (err) {
        console.log(err);
    }
}

module.exports = GetAssetsOverView;