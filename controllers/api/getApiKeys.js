const User = require("../../models/User");
const ApiKeys = require("../../models/ApiKeys");
var authFile = require("../../auth.js");




const getApiKeys = async function (req, res) {


    const { api_key, user_id } = req.body;

    const result = await authFile.apiKeyChecker(api_key);

    let user = await User.findOne({
        _id: user_id,
        status: 1,
    }).exec();

    if (user != null) {
        if (result === true) {

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


            let apiKeys = await ApiKeys.find({
                user_id: user._id,
                status: 1,
            }).exec();

            if (apiKeys) {
                return res.json({ status: "success", data: apiKeys });
            }
            else {
                return res.json({ status: "fail", message: "Api keys not found", showableMessage: "Api keys not found" });
            }

        }
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
    }


}

module.exports = getApiKeys;
