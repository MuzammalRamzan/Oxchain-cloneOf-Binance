const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const PairsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbolOne: { type: String, required: true },
  symbolOneID: { type: String, required: true },
  symbolTwo: { type: String, required: true },
  symbolTwoID: { type: String, required: true },
  type: { type: String, required: true },
  digits: { type: Number, required: true, default: 2 },
  status: { type: Number, required: false, default: 0 },
  spot_fee: { type: Number, default: 0.0 },
  margin_fee: { type: Number, default: 0.0 },
  future_fee: { type: Number, default: 0.0 },
  depositFee: { type: Number, required: false, default: 0 },
  withdrawFee: { type: Number, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

PairsSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Pairs", PairsSchema);
