const mongoose = require("mongoose");

const aboutUsSubSchema = new mongoose.Schema(
  {
    facebook: { type: String, required: false },
    twitter: { type: String, required: false },
    telegram: { type: String, required: false },
  },
  { _id: false }
);

const AdminSettingsSchema = new mongoose.Schema({
  deleteReasons: { type: [String], default: [] },
  aboutUs: { type: aboutUsSubSchema },
  privacy: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AdminSettings", AdminSettingsSchema);
