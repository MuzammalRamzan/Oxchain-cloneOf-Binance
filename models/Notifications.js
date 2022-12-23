const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  notificationTitle: { type: String, required: true },
  notificationMessage: { type: String, required: true },
  userId: { type: String, required: false, default: null },
  hasRead: { type: Boolean, default: false },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
