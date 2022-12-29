const mongoose = require("mongoose");

const VerificationIdSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  url: { type: String, required: true },
  url2: { type: String, required: false },
  url3: { type: String, required: false },
  status: { type: String, default: 0 },
  country: { type: String, required: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("VerificationId", VerificationIdSchema);
