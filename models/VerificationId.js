const mongoose = require("mongoose");

const VerificationIdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  subType: { type: String, required: false },
  url: { type: String, required: true },
  status: { type: String, default: "pending" },
  level: { type: String, required: true },
  country: { type: String, required: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("VerificationId", VerificationIdSchema);
