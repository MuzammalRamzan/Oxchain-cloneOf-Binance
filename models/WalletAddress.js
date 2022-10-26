const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const WalletAddressSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  network_id: { type: String, required: true, default: null },
  wallet_address: { type: String, required: true, default: null },
  private_key: { type: String, required: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("WalletAddress", WalletAddressSchema);
