const mongoose = require("mongoose");

const EarningSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  status: { type: Number, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Earnings", EarningSchema);
