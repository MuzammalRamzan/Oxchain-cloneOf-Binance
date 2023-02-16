const UserModel = require("../../models/User");
const AITradeWalletModel = require("../../models/AITradeWallet");
const AITradeSettingsModel = require("../../models/AITradeSettings");
const PairModel = require("../../models/Pairs");


const authFile = require("../../auth");

const setSettings = async (req, res) => {

    const { user_id, api_key, balance, maxLose, maxProfit, pair } = req.body;

    if (!user_id || !api_key || !balance || !maxLose || !maxProfit) {
        return res.json({
            status: "fail",
            message: "Please provide user_id, api_key, balance, maxLose and maxProfit"
        });
    }

    if (user_id.length !== 24) {
        return res.json({
            status: "fail",
            message: "Invalid user_id"
        });
    }

    var result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        let PairCheck = await PairModel.findOne({ pair: pair });

        if (!PairCheck) {
            return res.json({
                status: "fail",
                message: "Pair not found",
                showableMessage: "Pair not found"
            });
        }


        let userCheck = await UserModel.findOne({ _id: user_id });

        if (!userCheck) {
            return res.json({
                status: "fail",
                message: "User not found"
            });
        }

        let walletCheck = await AITradeWalletModel.findOne({ user_id: user_id });

        if (!walletCheck) {
            return res.json({
                status: "fail",
                message: "Wallet not found"
            });
        }


        //sum of all settings balance
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

        let settingCheck = await AITradeSettingsModel.findOne({
            user_id: user_id,
            pair: pair
        });

        if (settingCheck) {
            return res.json({
                status: "fail",
                message: "Setting already exists",
                showableMessage: "Setting already exists"
            });
        }

        let usedBalance = sumOfAllSettingsBalance[0].sum;

        let availableBalance = walletCheck.balance - parseFloat(usedBalance);

        if (availableBalance < sumOfAllSettingsBalance) {
            return res.json({
                status: "fail",
                message: "Insufficient balance",
                showableMessage: "Insufficient balance"
            });
        }

        let balanceFloat = parseFloat(balance);
        let maxLoseFloat = parseFloat(maxLose);
        let maxProfitFloat = parseFloat(maxProfit);

        let walletBalance = parseFloat(walletCheck.balance);

        if (walletBalance < balanceFloat) {
            return res.json({
                status: "fail",
                message: "Insufficient balance",
                showableMessage: "Insufficient balance"
            });
        }

        await walletCheck.save();

        let newSettings = new AITradeSettingsModel({
            user_id: user_id,
            balance: balanceFloat,
            maxLose: maxLoseFloat,
            maxProfit: maxProfitFloat,
            pair: pair,
            status: 1
        });

        await newSettings.save();

        return res.json({
            status: "success",
            message: "Settings saved"
        });

    }




}

module.exports = setSettings;