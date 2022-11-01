const mongoose = require("mongoose");

const MailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: false },
  pin: { type: String, required: false },
  reason: { type: String, required: false },
  status: { type: String, required: false, default: "0" },
  user_id: { type: String, required: false, default: "null" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MailVerification", MailVerificationSchema);
