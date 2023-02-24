const CoinList = require("../../models/CoinList");
const FutureOrder = require("../../models/FutureOrder");

async function calculateFutureFund(wallets, user_id) {
    let assets = [];
    for (var i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        
        let order = await FutureOrder.find({ pair_id: wallet.coin_id, user_id: user_id, future_type: 'cross', method: "market", type: "buy", status: 0 });
        let totalUsed = 0.0;
        let totalPNL = 0.0;
        let totalBalance = wallet.amount;
        let available = wallet.amount;
        let totalAmount = 0.0;
        for(var k = 0; k < order.length; k++) {
            let element = order[k];
            totalPNL += parseFloat(element.usedUSDT) + parseFloat(element.pnl);
            totalUsed += parseFloat(element.usedUSDT);
            totalBalance += totalPNL;
            available -= totalPNL;
            totalAmount += parseFloat(element.amount);
        }
  
        let inOrder = totalAmount;
        let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });
        assets.push({ "symbol": coinInfo.symbol, "totalBalance": totalBalance, "availableBalance": available, 'inOrder': inOrder });
    }
    return assets;
}

module.exports = calculateFutureFund;