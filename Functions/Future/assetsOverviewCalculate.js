const { default: axios } = require("axios");
const FutureWalletModel = require("../../models/FutureWalletModel");

const FutureAssetsOverviewCalculate = async(user_id) => {
    
    let future = await FutureWalletModel.findOne({ user_id: user_id });
    let priceData = await axios("http://18.170.26.150:8542/price?symbol=BTCUSDT");
    let btcPrice = priceData.data.data.ask;
    let btcValue = future.amount / btcPrice;
    return {
        totalUSD: future.amount,
        totalBTC: btcValue,
    }
}
module.exports = FutureAssetsOverviewCalculate;