const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");

const GetFutureWallet = async (sockets, user_id) => {

    let balance = await CalculateFutureBalance(user_id);
    if (balance <= 0) {
        sockets.in(user_id).emit("future_balance", { type: "future_balance", content: 0.0 });

    } else {
        sockets.in(user_id).emit("future_balance", { type: "future_balance", content: 0.0 });
    }

    FutureWalletModel.watch([
        { $match: { operationType: { $in: ["update"] } } },
    ]).on("change", async (data) => {
        balance = await CalculateFutureBalance(user_id);
        if (balance <= 0) {
            sockets.in(user_id).emit("future_balance", { type: "future_balance", content: 0.0 });
        } else {
            sockets.in(user_id).emit("future_balance", { type: "future_balance", content: 0.0 });
        }
    });
}


async function CalculateFutureBalance(user_id) {
    let totalPNL = 0.0;


    let getOpenOrders = await FutureOrder.aggregate([
        {
            $match: {
                user_id: user_id,
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
    let wallet = await FutureWalletModel.findOne({ user_id: user_id }).exec();
    if (getOpenOrders.length == 0) return wallet.amount;
    if (wallet == null) return 0;
    let balance = parseFloat(wallet.amount) + parseFloat(getOpenOrders[0].total);
    if (balance < 0) return 0;
    return balance;
}
module.exports = GetFutureWallet;