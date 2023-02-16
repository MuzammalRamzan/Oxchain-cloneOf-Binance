const UserModel = require("../../models/User");
const AITradeWalletModel = require("../../models/AITradeWallet");
const AITradeSettingsModel = require("../../models/AITradeSettings");
const PairModel = require("../../models/Pairs");
const authFile = require("../../auth");

const getAISettings = async (req, res) => {

    const { user_id, api_key } = req.body;

    if (!user_id || !api_key) {
        return res.json({
            status: "fail",
            message: "Please provide user_id and api_key"
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

        let userCheck = await UserModel.findOne({ _id: user_id });

        if (!userCheck) {
            return res.json({
                status: "fail",
                message: "User not found"
            });
        }

        const setting = await AITradeSettingsModel.find({ user_id: user_id });

        if (!setting) {
            return res.json({
                status: "fail",
                message: "Settings not found"
            });
        }

        let data = [];
        for (let i = 0; i < setting.length; i++) {

            let pair = await PairModel.findOne({ _id: setting[i].pair });

            if (!pair) {
                return res.json({
                    status: "fail",
                    message: "Pair not found"
                });
            }

            data.push({

                pair_name: pair.name,
                maxLose: setting[i].maxLose,
                maxProfix: setting[i].maxProfit,
                balance: setting[i].balance,
                status: setting[i].status,
            });
        }

        return res.json({
            status: "success",
            data: data
        });
    }

}

module.exports = getAISettings;