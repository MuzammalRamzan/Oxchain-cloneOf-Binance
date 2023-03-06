const mongoose = require("mongoose");

const LoginLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  ip: { type: String, required: true },
  deviceName: { type: String, required: true },
  manufacturer: { type: String, required: true },
  model: { type: String, required: true },
  deviceId: { type: String, required: true },
  trust: { type: String, required: false, default: "no" },
  deviceOS: { type: String, required: false },
  status: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("LoginLogs", LoginLogSchema);
