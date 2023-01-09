const mongoose = require("mongoose");

const SMSVerificationSchema = new mongoose.Schema({
  phone_number: { type: String, required: false },
  pin: { type: String, required: false },
  reason: { type: String, required: false },
  user_id: { type: String, required: false, default: "null" },
  status: { type: String, required: false, default: "0" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SMSVerification", SMSVerificationSchema);
