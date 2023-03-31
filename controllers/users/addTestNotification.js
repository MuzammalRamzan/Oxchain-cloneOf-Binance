
const User = require("../../models/User");
const UserNotifications = require("../../models/UserNotifications");

const add = async (req, res) => {

    const { user_id } = req.body;

    let newUserNotification = new UserNotifications({


        user_id: user_id,
        title: "Test Notification",
        message: "This is a test notification",
        read: false
    });


    await newUserNotification.save();

    return res.json({ status: "success", data: newUserNotification });

}

module.exports = add;