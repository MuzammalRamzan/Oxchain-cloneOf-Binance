const mongoose = require("mongoose");

const aboutUsSubSchema = new mongoose.Schema(
  {
    facebook: { type: String, required: false },
    twitter: { type: String, required: false },
    telegram: { type: String, required: false },
  },
  { _id: false }
);

const helpSubSchema = new mongoose.Schema(
  {
    helpCenter: { type: String, required: false },
    feedback: { type: String, required: false },
    support: { type: String, required: false },
  },
  { _id: false }
);

const AdminSettingsSchema = new mongoose.Schema({
  deleteReasons: { type: [String], default: [] },
  aboutUs: { type: aboutUsSubSchema },
  privacy: { type: String },
  help: { type: helpSubSchema },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AdminSettings", AdminSettingsSchema);
