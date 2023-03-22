const { default: axios } = require("axios");
const FutureWalletModel = require("../../models/FutureWalletModel");

const FutureAssetsOverviewCalculate = async (user_id) => {
    try {
        let future = await FutureWalletModel.findOne({ user_id: user_id });
        //let priceData = await axios("http://global.oxhain.com:8542/price?symbol=BTCUSDT");

        let priceData = await axios("http://global.oxhain.com:8542/future_price?symbol=BTCUSDT")
        
        let btcPrice = parseFloat(priceData.data.data.ask);
        let btcValue = future.amount / btcPrice;
        return {

            //fixed to max 8 decimal places

            totalUSD: splitLengthNumber(future.amount),
            totalBTC: splitLengthNumber(btcValue),
        }
    } catch (err) {

    }
}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}

module.exports = FutureAssetsOverviewCalculate;