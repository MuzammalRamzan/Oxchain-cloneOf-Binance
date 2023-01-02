const CoinList = require("../../../models/CoinList");
const Wallet = require("../../../models/Wallet");
const FutureOrderModel = require("../../../models/FutureOrder");

const SpotFunds = async (ws, user_id) => {
    let FutureOrders = await FutureOrderModel.find({
        user_id: user_id,
        method: "market",
        status: 1
    });

    let assets = await calculate(user_id);
    ws.send(JSON.stringify({ page: "spot", type: 'funds', content: assets }));
    FutureOrderModel.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let assets = await calculate(user_id);
        ws.send(JSON.stringify({ page: "spot", type: 'funds', content: assets }));
    });
}

async function calculate(user_id) {


    let assets = [];

    let CoinListFind = await CoinList.find({});

    for (var i = 0; i < CoinListFind.length; i++) {
        let coinInfo = CoinListFind[i];
        let FutureOrders = await FutureOrderModel.findOne({
            user_id: user_id.toString(),
            method: "market",
            status: 0,
            pair_name: coinInfo.symbol + "/USDT"
        });

        let amountData = 0;
        let pnl = 0;
        if (FutureOrders != null) {
            amountData = FutureOrders.amount;
            pnl = FutureOrders.pnl;

        }

        assets.push(
            {
                "symbol": coinInfo.symbol,
                "totalBalance": amountData,
                "availableBalance": amountData,
                "name": coinInfo.name,
                "icon": coinInfo.image_url,
                "inOrder": 0.00,
                "pnl": pnl,
                "availableBalance": 0.00,
                "positionMargin": 0.00,
                "OrderMargin": 0.00,
                "Bonus": 0.00,
            }
        );
    }
    return assets;
}
module.exports = SpotFunds;