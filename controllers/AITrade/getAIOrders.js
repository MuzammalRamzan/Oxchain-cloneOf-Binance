const AITradeLogsModel = require('../../models/AITradeLogs');
const authFile = require('../../auth.js');

const getAIOrders = async (req, res) => {

    const { api_key, user_id } = req.body;

    const result = await authFile.apiKeyChecker(api_key);


    if (result === true) {

        let key = req.headers["key"];

        if (!key) {
            return res.json({ status: "fail", message: "key_not_found" });
        }

        if (!req.body.device_id || !req.body.user_id) {
            return res.json({ status: "fail", message: "invalid_params" });
        }

        let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


        if (checkKey === "expired") {
            return res.json({ status: "fail", message: "key_expired" });
        }

        if (!checkKey) {
            return res.json({ status: "fail", message: "invalid_key" });
        }

        if (user_id === undefined || user_id === null || user_id === "") {
            return res.json({
                status: false,
                message: "Invalid User ID"
            });
        }
        let orders = await AITradeLogsModel.find({
            user_id: user_id
        }).sort({ createdAt: -1 }).exec();

        return res.json({
            status: true,
            data: orders
        });

    }
    else {
        return res.json({
            status: false,
            message: "Invalid API Key"
        });
    }


}

module.exports = getAIOrders;