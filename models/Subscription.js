const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  email: { type: String, required: false, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
