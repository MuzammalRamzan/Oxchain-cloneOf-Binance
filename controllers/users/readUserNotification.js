const User = require("../../models/User");
const UserNotifications = require("../../models/UserNotifications");
var authFile = require("../../auth.js");

const readUserNotification = async function (req, res) {

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


    const { user_id, limit } = req.body;

    let userCheck = await User.findOne({ _id: user_id });

    if (!userCheck) {
        return res.json({ status: "fail", data: "User not found" });
    }

    let userNotifications = "";

    if (limit == null || limit == undefined || limit == "") {
        userNotifications = await UserNotifications.find({ user_id: user_id, read: false });

    }
    else {
        userNotifications = await UserNotifications.find({ user_id: user_id, read: false }).limit(limit);

    }

    for (let i = 0; i < userNotifications.length; i++) {
        let userNotification = userNotifications[i];
        userNotification.read = true;
        await userNotification.save();
    }

    return res.json({ status: "success", message: "Notifications marked as read" });

}

module.exports = readUserNotification;