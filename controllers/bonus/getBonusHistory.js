var authFile = require("../../auth.js");
const Bonus = require("../../models/Bonus");
const getBonusHistory = async (req, res) => {

    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);
    if (result != false) {
        res.json({ 'status': false, 'message': 'Not auth' });
        return;
    }

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

    let user_id = req.body.user_id;
    let list = await Bonus.find({ user_id: user_id }).exec();
    res.json({ 'status': true, 'data': list });
}

module.exports = getBonusHistory;