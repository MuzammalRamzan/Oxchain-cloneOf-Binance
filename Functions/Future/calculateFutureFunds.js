const CoinList = require("../../models/CoinList");
const FutureOrder = require("../../models/FutureOrder");

async function calculateFutureFund(wallet) {
    let assets = [];


    let order = await FutureOrder.find({ user_id: wallet.user_id, method: "market", status: 0 });
    let totalUsed = 0.0;
    let totalPNL = 0.0;
    let totalJustPNL = 0.0;
    let totalBalance = wallet.amount;
    let available = wallet.amount;
    let totalAmount = 0.0;
    for (var k = 0; k < order.length; k++) {
        let element = order[k];
        totalJustPNL += parseFloat(element.pnl);
        totalPNL += parseFloat(element.usedUSDT) + parseFloat(element.pnl);
        totalUsed += parseFloat(element.usedUSDT);
        totalBalance += totalPNL;
        available -= totalPNL;
        totalAmount += parseFloat(element.amount);
    }

    //fixed to 8 decimal places
    totalBalance = splitLengthNumber(totalBalance);
    available = splitLengthNumber(available);

    let inOrder = totalAmount;
    let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });
    assets.push({ "walletBalance" :  (totalUsed + wallet.amount) , "unrealizedPnl" : totalJustPNL, "marginBalance" : totalBalance,"totalBalance": totalBalance, "availableBalance": available, 'inOrder': inOrder });
    return assets;
}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}

module.exports = calculateFutureFund;