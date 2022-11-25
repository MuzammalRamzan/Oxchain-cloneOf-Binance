const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  p2pProfileSetting: { type: Object, default: {} },
  notificationLanguage: { type: String, required: false },
  orderConfirmationReminders: { type: Object, default: {} },
  oneSiteNotification: { type: Boolean, default: false },
  marketingEmails: { type: Boolean, default: false },
  analytics: { type: Boolean, default: false },
  advertising: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Settings", SettingsSchema);
