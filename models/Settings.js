const mongoose = require("mongoose");

const notificationSubSchema = new mongoose.Schema(
  {
    operational: { type: String, default: false },
    transactionRisk: { type: String, default: false },
    marketing: { type: String, default: false },
  },
  { _id: false }
);

const privacySubSchema = new mongoose.Schema(
  {
    advertising: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  notifications: { type: notificationSubSchema },
  language: { type: String, default: "english" },
  currency: { type: String, default: "USD" },
  privacy: { type: privacySubSchema },
  autoLock: { type: String, required: false },
  lightMode: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Settings", SettingsSchema);
