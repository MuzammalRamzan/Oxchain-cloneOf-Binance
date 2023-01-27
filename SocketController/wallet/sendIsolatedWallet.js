const Pairs = require("../../models/Pairs");

const SendIsolatedWallet = async (sockets, _wallets, user_id)  => {
    var wallets = new Array();
    
    for (var i = 0; i < _wallets.length; i++) {
        let item = _wallets[i];

        let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
        if (pairInfo == null) continue;
        wallets.push({
            id: item._id,
            coin_id: item.coin_id,

            balance: item.amount,
            address: item.address,
            symbolName: pairInfo.name,
        });
    }
    sockets.in(user_id).emit("margin_isolated_balance", { page: "margin", type: "isolated_wallet", content: wallets });
}
module.exports = SendIsolatedWallet;