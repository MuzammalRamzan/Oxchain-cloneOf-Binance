const { default: axios } = require("axios");
const FutureWalletModel = require("../../models/FutureWalletModel");

const FutureAssetsOverviewCalculate = async(user_id) => {
    try {
    let future = await FutureWalletModel.findOne({ user_id: user_id });
    //let priceData = await axios("http://18.170.26.150:8542/price?symbol=BTCUSDT");
    
    let btcPrice = global.MarketData["BTCUSDT"].ask
    let btcValue = future.amount / btcPrice;
    return {
        totalUSD: future.amount,
        totalBTC: btcValue,
    }
} catch(err) {

}
}
module.exports = FutureAssetsOverviewCalculate;