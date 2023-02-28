
const User = require("../../models/User");
const UserNotifications = require("../../models/UserNotifications");

const getNotification = async (req, res) => {

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