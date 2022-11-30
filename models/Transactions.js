const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const TransactionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  type: { type: String, required: false, default: null },
  amount: { type: Number, required: false, default: null },
  asset: { type: String, required: false, default: "USDT" },
  status: { type: Number, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transactions", TransactionSchema);
