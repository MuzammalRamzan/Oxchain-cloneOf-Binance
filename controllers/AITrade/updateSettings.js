const UserModel = require("../../models/User");
const AITradeWalletModel = require("../../models/AITradeWallet");
const AITradeSettingsModel = require("../../models/AITradeSettings");
const PairModel = require("../../models/Pairs");


const updateSettings = async (req, res) => {

    const { user_id, api_key, balance, maxLose, maxProfit, id, status } = req.body;

    if (!user_id || !api_key || !balance || !maxLose || !maxProfit || !id) {
        return res.json({
            status: "fail",
            message: "Please provide all fields"
        });
    }


    var result = await authFile.apiKeyChecker(api_key);

    if (result === true) {


        if (status == 1 || status == 0) {
        }
        else {
            return res.json({
                status: "fail",
                message: "Invalid status"
            });
        }


        if (user_id.length !== 24) {
            return res.json({
                status: "fail",
                message: "Invalid user_id"
            });
        }

        let PairCheck = await PairModel.findOne({ pair: pair });

        if (!PairCheck) {
            return res.json({
                status: "fail",
                message: "Pair not found",
                showableMessage: "Pair not found"
            });
        }


        let settingCheck = await AITradeSettingsModel.findOne({
            _id: id,
            user_id: user_id
        });


        if (!settingCheck) {
            return res.json({
                status: "fail",
                message: "Setting not found"
            });
        }



        let sumOfAllSettingsBalance = await AITradeSettingsModel.aggregate([
            {
                $match: {
                    user_id: user_id
                }
            },
            {
                $group: {
                    _id: null,
                    sum: { $sum: "$balance" }
                }
            }
        ]);


        let usedBalance = sumOfAllSettingsBalance[0].sum - settingCheck.balance;

        let newUsedBalance = usedBalance + parseFloat(balance);

        if (newUsedBalance > walletCheck.balance) {
            return res.json({
                status: "fail",
                message: "Insufficient balance",
                showableMessage: "Insufficient balance"
            });
        }

        let balanceFloat = parseFloat(balance);
        let maxLoseFloat = parseFloat(maxLose);
        let maxProfitFloat = parseFloat(maxProfit);



        if (balance != null || balance != undefined || balance != "" || !balance < 0) {
            settingCheck.balance = balanceFloat;
        }

        if (maxLose != null || maxLose != undefined || maxLose != "" || !maxLose < 0) {
            settingCheck.maxLose = maxLoseFloat;
        }

        if (maxProfit != null || maxProfit != undefined || maxProfit != "" || !maxProfit < 0) {
            settingCheck.maxProfit = maxProfitFloat;
        }

        if (status != null || status != undefined || status != "" || !status < 0) {
            settingCheck.status = status;
        }


        await settingCheck.save();

        return res.json({
            status: "success",
            message: "Settings updated successfully"
        });


    }



}







module.exports = updateSettings;