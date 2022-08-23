const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const MarginWalletSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  coin_id: { type: String, required: true },
  amount: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

MarginWalletSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MarginWallet", MarginWalletSchema);