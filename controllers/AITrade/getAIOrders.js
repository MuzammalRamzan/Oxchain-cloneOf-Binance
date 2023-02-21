const AITradeLogsModel = require('../../models/AITradeLogs');
const authFile = require('../../auth.js');

const getAIOrders = async (req, res) => {

    const { api_key, user_id } = req.body;

    const result = await authFile.apiKeyChecker(api_key);


    if (result === true) {
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