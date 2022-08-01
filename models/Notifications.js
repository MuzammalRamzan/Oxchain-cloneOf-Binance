const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const NotificationSchema = new mongoose.Schema({
  notificationTitle: { type: String, required: true },
  notificationMessage: { type: String, required: true },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
