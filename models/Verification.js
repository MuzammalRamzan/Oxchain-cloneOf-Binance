const mongoose = require("mongoose");

const documentSubSchema = new mongoose.Schema({
  type: { type: String, required: true },
  subType: { type: String, required: false },
  url: { type: String, required: false },
  status: { type: String, default: "pending" },
  level: { type: String, required: true },
  country: { type: String, required: false },
});

const VerificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  documents: { type: [documentSubSchema], default: [] },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Verification", VerificationSchema);
