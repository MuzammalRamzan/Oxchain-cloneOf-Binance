const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  deviceName: { type: String, required: true },
  deviceType: { type: String, required: true },
  ip: { type: String, required: true },
  city: { type: String, required: true },
  isActive: { type: Boolean, required: false },
  loginTime: { type: Date, required: false },
  lastLoginTime: { type: Date, required: false },
  status: { type: String, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Devices", DeviceSchema);
