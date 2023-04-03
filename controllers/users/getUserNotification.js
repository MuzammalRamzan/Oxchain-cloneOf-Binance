
const User = require("../../models/User");
const UserNotifications = require("../../models/UserNotifications");
var authFile = require("../../auth.js");

const getNotification = async (req, res) => {

    let result = await authFile.apiKeyChecker(req.body.api_key);
    if (result != true)
        return res.json({ status: "fail", message: "Invalid api key" });

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


    const { user_id, limit, api_key } = req.body;

    let UserCheck = await User.findOne({ _id: user_id });

    if (!UserCheck) {
        return res.json({ status: "error", data: "User not found" });
    }

    let UserNotificationsCheck = "";

    if (limit == null || limit == undefined || limit == "") {
        UserNotificationsCheck = await UserNotifications.find({ user_id: user_id }).sort({ createdAt: -1 }).exec();
    }
    else {

        UserNotificationsCheck = await UserNotifications.find({ user_id: user_id }).sort({ createdAt: -1 }).limit(limit).exec();

    }




    return res.json({ status: "success", data: UserNotificationsCheck });
}

module.exports = getNotification