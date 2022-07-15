const mongoose = require("mongoose");

const DepositsSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  coin_id: { type: String, required: true },
  amount: { type: String, required: true },
  address: { type: String, required: true },
  tx_id: { type: String, required: false, default: null },
  type: { type: String, required: false, default: null },
  currency: { type: String, required: false, default: null },
  fee: { type: String, required: false, default: null },
  updatedAt: { type: String, required: false, default: null },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Deposits", DepositsSchema);
