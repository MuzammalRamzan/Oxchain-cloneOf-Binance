const CoinList = require("../../models/CoinList");

async function SpotFundsCalculate(wallets) {
    let assets = [];
    let btcPriceData = await axios("http://global.oxhain.com:8542/price?symbol=BTCUSDT")
    for (var i = 0; i < wallets.length; i++) {

        let wallet = wallets[i];
        if(wallet.amount <= 0) continue;
        let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });


        let btcPrice = 0;
        let usdtPrice = 0;


        let amountData = wallet.amount;

        
        if (coinInfo.symbol == "BTC") {
            btcPrice = amountData;
            
            usdtPrice = amountData * parseFloat(btcPriceData.data.data.ask);
        }
        else {
            let priceData = await axios("http://global.oxhain.com:8542/price?symbol="+coinInfo.symbol.toUpperCase()+"USDT");

            btcPrice = amountData * parseFloat(priceData.data.data.ask) / parseFloat(btcPriceData.data.data.ask);
            usdtPrice = amountData * parseFloat(priceData.data.data.ask);
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
module.exports = SpotFundsCalculate;