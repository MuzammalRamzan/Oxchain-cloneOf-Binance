const mongoose = require("mongoose");

const MailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: false },
  pin: { type: String, required: false },
  status: { type: String, required: false, default: "0" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MailVerification", MailVerificationSchema);
