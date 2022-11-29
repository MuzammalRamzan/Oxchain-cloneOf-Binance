const CoinList = require("../../../models/CoinList");
const FutureOrder = require("../../../models/FutureOrder");
const FutureWalletModel = require("../../../models/FutureWalletModel");

const FutureAssets = async (ws, user_id) => {
    
    let wallets = await FutureWalletModel.find({ user_id: user_id, status: 1 });
    let assets = await calculate(wallets,user_id);
    ws.send(JSON.stringify({ page:"future", type: 'assets', content: assets }));

    FutureWalletModel.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await FutureWalletModel.find({ user_id: user_id, status: 1 });
        let assets = await calculate(wallets, user_id);
        ws.send(JSON.stringify({page:"future", type: 'assets', content: assets }));
    });
}

async function calculate(wallets, user_id) {
    let assets = [];
    for (var i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        if(wallet.address == null || wallet.address == '') continue;
        
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
            console.log(totalBalance);
            available -= totalPNL;
            totalAmount += parseFloat(element.amount);
        }
  
        let inOrder = totalAmount;
        let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });
        assets.push({ "symbol": coinInfo.symbol, "totalBalance": totalBalance, "availableBalance": available, 'inOrder': inOrder });
    }
    return assets;
}
module.exports = FutureAssets;