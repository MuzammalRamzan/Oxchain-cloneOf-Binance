const SiteNotificationsModel = require('../../models/SiteNotifications');
var authFile = require("../../auth.js");


const get = async (req, res) => {

    let user_id = req.body.user_id;
    let api_key = req.body.api_key;


    if (user_id == null || api_key == null) {

        return res.json({ status: "error", message: "Missing user_id or api_key", showableMessage: "Missing user_id or api_key" })

    }

    let result = await authFile.apiKeyChecker(api_key);


    if (result == true) {

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

        let check = await SiteNotificationsModel
            .findOne({ user_id: user_id })
            .exec();

        if (check == null) {
            return res.json({ status: "error", message: "No user found", showableMessage: "No user found" })
        }

        return res.json({ status: "success", message: "Found", showableMessage: "Found", data: check })
    }
}



module.exports = get;