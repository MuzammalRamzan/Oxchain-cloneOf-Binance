const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const WalletSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  coin_id: { type: String, required: true },
  amount: { type: String, required: true },
  type: { type: String, required: true },
  address: { type: String, required: false, default: null },
  privateKey: { type: String, required: false, default: null },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

WalletSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Wallet", WalletSchema);
