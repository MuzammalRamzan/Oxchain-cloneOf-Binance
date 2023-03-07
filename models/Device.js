const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  deviceId: { type: String, required: true },
  deviceName: { type: String, required: true },
  deviceType: { type: String, required: true },
  deviceOs: { type: String, required: false },
  deviceVersion: { type: String, required: false },
  ip: { type: String, required: true },
  city: { type: String, required: true },
  isActive: { type: Boolean, required: false },
  loginTime: { type: Date, required: false },
  lastLoginTime: { type: Date, required: false },
  loginRequest: { type: Number, required: false, default: 0 },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Devices", DeviceSchema);
