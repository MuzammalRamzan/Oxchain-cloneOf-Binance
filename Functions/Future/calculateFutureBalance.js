const FutureOrder = require("../../models/FutureOrder");

const calculateFutureBalance = async(wallet) => {
    if(wallet == null) return 0;
    let getOpenOrders = await FutureOrder.aggregate([
        {
            $match: {
                user_id: wallet.user_id,
                status: 0,
                method: "market",
                future_type: "cross",
            },
        },

        {
            $group: {
                _id: "$user_id",
                total: { $sum: "$pnl" },
                usedUSDT: { $sum: "$usedUSDT" },
            },
        },
    ]);
    
    
    if (getOpenOrders.length == 0) return wallet.amount;
    if (wallet == null) return 0;
    let balance = parseFloat(wallet.amount) + parseFloat(getOpenOrders[0].total);
    if (balance < 0) return 0;

    //8 decimal places max
    balance = splitLengthNumber(balance);
    
    return balance;
}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}

module.exports = calculateFutureBalance;