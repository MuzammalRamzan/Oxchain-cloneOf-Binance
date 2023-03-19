const CoinList = require("../../models/CoinList");
const Network = require("../../models/Network");
const Withdraw = require("../../models/Withdraw");
var authFile = require("../../auth.js");

const GetWithdrawHistory = async (req, res) => {


    let result = await authFile.apiKeyChecker(req.body.api_key);
    if (result === false) {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
    }

    let key = req.headers["key"];

    if (!key) {
        return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
        return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
        return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
        return res.json({ status: "fail", message: "invalid_key" });
    }


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