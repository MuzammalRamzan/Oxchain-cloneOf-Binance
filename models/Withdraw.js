const mongoose = require("mongoose");

const WithdrawSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  coin_id: { type: String, required: true },
  amount: { type: Number, required: true },
  to: { type: String, required: true },
  tx_id: { type: String, required: false, default: null },
  type: { type: String, required: false, default: null },
  fee: { type: Number, required: false, default: null },
  network_id : {type : mongoose.Schema.Types.ObjectId, ref : "Network" },
  updatedAt: { type: String, required: false, default: null },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Withdraws", WithdrawSchema);
