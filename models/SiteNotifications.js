const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const SiteNotificationsSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    activities: { type: String, required: false, default: 1 },
    trade: { type: String, required: false, default: 1 },
    news: { type: String, required: false, default: 1 },
    system_messages: { type: String, required: false, default: 1 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("SiteNotifications", SiteNotificationsSchema);
