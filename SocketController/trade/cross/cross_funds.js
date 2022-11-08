const CoinList = require("../../../models/CoinList");
const MarginOrder = require("../../../models/MarginOrder");
const Wallet = require("../../../models/Wallet")

const CrossFunds = async (ws, user_id) => {
    let wallets = await Wallet.find({ user_id: user_id, status: 1 });
    let assets = await calculate(wallets,user_id);
    ws.send(JSON.stringify({ type: 'funds', content: assets }));

    MarginOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await Wallet.find({ user_id: user_id, status: 1 });
        let assets = await calculate(wallets, user_id);
        ws.send(JSON.stringify({ type: 'funds', content: assets }));
    });
}

async function calculate(wallets, user_id) {
    let assets = [];
    for (var i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        let order = await MarginOrder.find({ pair_id: wallet.coin_id, user_id: user_id, margin_type: 'cross', method: "market", type: "buy", status: 0 });
        let totalUsed = 0.0;
        let totalPNL = 0.0;
        let totalBalance = 0.0;
        let totalAmount = 0.0;
        order.forEach((element, index) => {
            totalPNL += parseFloat(element.usedUSDT) + parseFloat(element.pnl);
            totalUsed += parseFloat(element.usedUSDT);
            totalBalance += totalPNL + parseFloat(wallet.amount);
            totalAmount += parseFloat(element.amount);

        });
        let available = wallet.amount - totalUsed;
        let inOrder = totalAmount;
        let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });
        assets.push({ "symbol": coinInfo.symbol, "totalBalance": totalBalance, "availableBalance": available, 'inOrder': inOrder });
    }
    return assets;
}
module.exports = CrossFunds;