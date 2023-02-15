const mongoose = require("mongoose");

const UserNotificationSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, required: false },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("UserNotifications", UserNotificationSchema);
