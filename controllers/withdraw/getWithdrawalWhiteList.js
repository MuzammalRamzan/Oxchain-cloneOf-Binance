const WithdrawalWhiteListModel = require("../../models/WithdrawalWhiteList");
const authFile = require("../../auth.js");


const getWithdrawalWhiteList = async (req, res) => {

    const api_key = req.body.api_key;
    const user_id = req.body.user_id;

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