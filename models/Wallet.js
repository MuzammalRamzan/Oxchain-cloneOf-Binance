const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const WalletSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  coin_id: { type: String, required: true },
  amount: { type: Number, required: true, default: 0.00 },
  type: { type: String, required: true },
  address: { type: String, required: false, default: null },
  privateKey: { type: String, required: false, default: null },
  pnl : {type : Number, required: false, default:0.0 },
  totalBonus : {type : Number, required : false, default : 0.0},
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

WalletSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Wallet", WalletSchema);
