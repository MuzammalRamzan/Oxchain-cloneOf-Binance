const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel")

const GetDerivatives = async (sockets, user_id) => {
    let wallet = await FutureWalletModel.findOne({ user_id: user_id });
    let futureOrders = await FutureOrder.aggregate([
        {
            $match: { status: 0, method: "market", future_type: "cross" },
        },
        {
            $group: {
                _id: "$user_id",
                total: { $sum: "$pnl" },
                usedUSDT: { $sum: "$usedUSDT" },
            },
        },
    ]);
    console.log(futureOrders);
    let filter = futureOrders.filter((x) => x._id == user_id);
    if (filter.length == 0) {
        sockets.in(user_id).emit("derivatives", {
            page: "derivatives", type: 'derivatives', content: {
                coin : "USDT",
                netEquity: wallet.amount,
                walletBalance: wallet.amount,
                availableBalance: wallet.amount,
                unrealizedPNL: 0
            }
        });
    } else {
        sockets.in(user_id).emit("derivatives", {
            page: "derivatives", type: 'derivatives', content: {
                coin : "USDT",
                walletBalance: wallet.amount,
                netEquity: wallet.amount + (filter[0].total + filter[0].usedUSDT),
                availableBalance: wallet.amount + (filter[0].total + filter[0].usedUSDT),
                unrealizedPNL: filter[0].total,
            }
        });
    }

}

module.exports = GetDerivatives;