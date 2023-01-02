const CoinList = require("../../../models/CoinList");
const MarginOrder = require("../../../models/MarginOrder");
const Wallet = require("../../../models/Wallet")

const SpotFunds = async (ws, user_id) => {
    let wallets = await Wallet.find({ user_id: user_id, status: 1 });
    let assets = await calculate(wallets, user_id);
    ws.send(JSON.stringify({ page: "spot", type: 'funds', content: assets }));

    Wallet.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await Wallet.find({ user_id: user_id, status: 1 });
        let assets = await calculate(wallets, user_id);
        ws.send(JSON.stringify({ page: "spot", type: 'funds', content: assets }));
    });
}

async function calculate(wallets, user_id) {
    let assets = [];
    for (var i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        if (wallet.address == null || wallet.address == '') continue;
        let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });
        assets.push(
            {
                "symbol": coinInfo.symbol,
                "totalBalance": wallet.amount,
                "availableBalance": wallet.amount,
                "name": coinInfo.name,
                "icon": coinInfo.image_url,
                'inOrder': 0.00
            }
        );
    }
    return assets;
}
module.exports = SpotFunds;