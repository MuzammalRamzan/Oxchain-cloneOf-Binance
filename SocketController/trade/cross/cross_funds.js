const CoinList = require("../../../models/CoinList");
const MarginCrossWallet = require("../../../models/MarginCrossWallet");
const MarginOrder = require("../../../models/MarginOrder");
const Wallet = require("../../../models/Wallet")

const CrossFunds = async (sockets, user_id) => {
   
    let wallets = await MarginCrossWallet.find({ user_id: user_id, status: 1 });
    let assets = await calculate(wallets);
    sockets.in(user_id).emit("cross_funds", { page: "margin_cross", type: 'funds', content: assets });
    

    MarginCrossWallet.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await MarginCrossWallet.find({ user_id: user_id, status: 1 });
        let assets = await calculate(wallets);
        sockets.in(user_id).emit("cross_funds", { page: "margin_cross", type: 'funds', content: assets });
    });
}

async function calculate(wallets, user_id) {
    let assets = [];
    for (var i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        let order = await MarginOrder.find({ pair_id: wallet.coin_id, user_id: user_id, margin_type: 'cross', method: "market", type: "buy", status: 0 });
        let totalUsed = 0.0;
        let totalPNL = 0.0;
        let totalBalance = wallet.amount;
        let available = wallet.amount;
        let totalAmount = 0.0;
        let totalBTCVal = 0.0;
        
        for(var k = 0; k < order.length; k++) {
            let element = order[k];
            if(wallet.coin_id == '62aaf66c419ff12e16168c8e') {
                //IS BTC 
            }
            totalPNL += parseFloat(element.usedUSDT) + parseFloat(element.pnl);
            totalUsed += parseFloat(element.usedUSDT);
            totalBalance += totalPNL;
            available -= totalPNL;
            totalAmount += parseFloat(element.amount);
        }
  
        let inOrder = totalAmount;
        let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });
        assets.push({ "symbol": coinInfo.symbol, btcValue : 0,"totalBalance": totalBalance, "availableBalance": available, 'inOrder': inOrder });
    }
    return assets;
}
module.exports = CrossFunds;