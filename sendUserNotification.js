const UserModel = require("../models/User");
const UserNotifications = require("../models/UserNotifications");


async function sendUserNotification(title, message, user_id) {
    let newNotification = new UserNotifications({
        title: title,
        message: message,
        user_id: user_id,
        read: false
    });
    await newNotification.save();
}

module.exports = sendUserNotification;