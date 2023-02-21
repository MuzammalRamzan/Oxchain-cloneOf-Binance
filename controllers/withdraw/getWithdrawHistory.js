const CoinList = require("../../models/CoinList");
const Network = require("../../models/Network");
const Withdraw = require("../../models/Withdraw");

const GetWithdrawHistory = async (req, res) => {

    let { user_id } = req.body;

    if (!user_id) {
        return res.json(
            {
                status: "fail",
                message: "user_id is required",

            }
        );
    }


    let withdrawHistory = await Withdraw.find({ user_id: user_id }).exec();

    let withdrawHistoryData = [];

    for (let i = 0; i < withdrawHistory.length; i++) {

        let coinInfo = await CoinList.findOne({ _id: withdrawHistory[i].coin_id }).exec();
        let networkInfo = await Network.findOne({ _id: withdrawHistory[i].network_id }).exec();
        if (coinInfo == null || networkInfo == null) continue;

        withdrawHistoryData.push({
            id: withdrawHistory[i]._id,
            coin: {
                id: withdrawHistory[i].coin_id,
                name: coinInfo.symbol,
            },
            network: {
                id: withdrawHistory[i].network_id,
                name: networkInfo.symbol,
            },
            hash: withdrawHistory[i].tx_id,
            fee: withdrawHistory[i].fee,
            amount: withdrawHistory[i].amount,
            fromAddress: withdrawHistory[i].fromAddress,
            toAddress: withdrawHistory[i].address,
            date: withdrawHistory[i].createdAt,
            status: withdrawHistory[i].status,
        });
    }

    return res.json(
        {
            status: "success",
            message: "withdraw history",
            data: withdrawHistoryData
        })


}

module.exports = GetWithdrawHistory;