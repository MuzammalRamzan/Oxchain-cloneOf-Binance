const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const ReferralSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  reffer: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Referral", ReferralSchema);
