const UserModel = require("../../models/User");
const authFile = require("../../auth.js");
const LoginLogsModel = require("../../models/LoginLogs");

const activities = async function (req, res) {

    var user_id = req.body.user_id;
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);

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

        let user = await UserModel.findOne({
            _id: user_id,
        }).exec();

        if (user != null) {


            let loginLogs = await LoginLogsModel.find({
                user_id: user_id,
            }).sort({ createdAt: -1 }).exec();

            if (loginLogs != null) {
                return res.json({
                    status: "success",
                    message: "login_logs_found",
                    showableMessage: "Login Logs Found",
                    data: loginLogs,
                });
            } else {
                return res.json({
                    status: "fail",
                    message: "login_logs_not_found",
                    showableMessage: "Login Logs Not Found",
                });
            }
        }
    }

};

module.exports = activities;

