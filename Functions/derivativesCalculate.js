const { default: axios } = require("axios");
const FutureOrder = require("../models/FutureOrder");

const DerivativesCalculate = async(wallet) => {
    let user_id = wallet.user_id;
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
    
    let filter = futureOrders.filter((x) => x._id == user_id);
    if (filter.length == 0) {
        let btcVal = await getBTCValue(wallet.amount);
        return {
            page: "derivatives", type: 'derivatives', content: {
                totalEquityUSD: wallet.amount,
                totalEquityBTC: btcVal,
                unrealizedPNLUSD: 0,
                unrealizedPNLBTC: 0,
                list:
                    [{

                        coin: "USDT",
                        netEquity: wallet.amount,
                        walletBalance: wallet.amount,
                        availableBalance: wallet.amount,
                        unrealizedPNL: 0
                    }
                    ]
            }
        };
    } else {
        let btcVal = await getBTCValue(wallet.amount);
        return {
            page: "derivatives", type: 'derivatives', content: {
                totalEquityUSD: wallet.amount,
                totalEquityBTC: btcVal,
                unrealizedPNLUSD: 0,
                unrealizedPNLBTC: 0,
                list: [
                    {
                        coin: "USDT",
                        walletBalance: wallet.amount,
                        netEquity: wallet.amount + (filter[0].total + filter[0].usedUSDT),
                        availableBalance: wallet.amount + (filter[0].total + filter[0].usedUSDT),
                        unrealizedPNL: filter[0].total,
                    }
                ]
            }
        };
        
    }

}

const getBTCValue = async (q) => {
    let priceInfo = await axios("http://global.oxhain.com:8542/price?symbol=BTCUSDT");
    let price = priceInfo.data.data.ask;
    return parseFloat(q) / price;
}

module.exports = DerivativesCalculate;