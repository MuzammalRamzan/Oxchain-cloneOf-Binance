const User = require('../../models/User');
const AITradeWallet = require('../../models/AITradeWallet');
const authFile = require('../../auth');

const getWallet = async (req, res) => {

    const { user_id, api_key } = req.body;




    if (!user_id || !api_key) {
        return res.json({
            status: "fail",
            message: "Please provide user_id and api_key"
        });
    }

    var result = await authFile.apiKeyChecker(api_key);

    if (result === true) {
        if (user_id.length !== 24) {
            return res.json({
                status: "fail",
                message: "Invalid user_id"
            });
        }

        let userCheck = await User.findOne({ _id: user_id });

        if (!userCheck) {
            return res.json({
                status: "fail",
                message: "User not found"
            });
        }

        let wallet = await AITradeWallet.findOne({ user_id: user_id });

        if (!wallet) {
            return res.json({
                status: "fail",
                message: "Wallet not found"
            });
        }

        return res.json({
            status: "success",
            data: wallet
        });
    }








}

module.exports = getWallet;