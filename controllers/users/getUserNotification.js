
const User = require("../../models/User");
const UserNotifications = require("../../models/UserNotifications");

const getNotification = async (req, res) => {

    const { user_id } = req.body;

    let UserCheck = await User.findOne({ _id: user_id });

    if (!UserCheck) {
        return res.json({ status: "error", data: "User not found" });
    }

    let UserNotificationsCheck = await UserNotifications.find({ user_id: user_id });



    return res.json({ status: "success", data: UserNotificationsCheck });
}

module.exports = getNotification