const WithdrawalWhiteListModel = require("../../models/WithdrawalWhiteList");
const authFile = require("../../auth.js");


const getWithdrawalWhiteList = async (req, res) => {

    const api_key = req.body.api_key;
    const user_id = req.body.user_id;

    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        const withdrawalWhiteList = await WithdrawalWhiteListModel.findOne({
            user_id: user_id,
            status: 1,
        }).exec();

        if (withdrawalWhiteList != null) {
            return res.json({ status: "success", message: "enabled", showableMessage: "Withdrawal white list enabled" });
        }
        else {
            return res.json({ status: "fail", message: "disabled", showableMessage: "Withdrawal white list disabled" });
        }
    }
    else {
        return res.json({ status: "fail", message: "api_key_invalid", showableMessage: "Api key is invalid" });
    }

};

module.exports = getWithdrawalWhiteList;