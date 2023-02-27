const User = require("../../models/User");
const UserNotifications = require("../../models/UserNotifications");

const readUserNotification = async function (req, res) {

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