const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const FutureOrderSchema = new mongoose.Schema({
  pair_id: { type: String, required: true },
  pair_name: { type: String, required: true },
  type: { type: String, required: true },
  future_type: { type: String, required: true, default: "cross" },
  method: { type: String, required: true, default: "market" },
  user_id: { type: String, required: true },
  amount: { type: Number, required: true, maxlength: 8 },
  isolated: { type: Number, required: false, default: 0.0 },
  target_price: { type: Number, required: false, default: 0.0, maxlength: 8 },
  open_price: { type: Number, required: true },
  open_time: { type: Date, default: Date.now },
  sl: { type: Number, required: false, default: 0.0, maxlength: 8 },
  tp: { type: Number, required: false, default: 0.0, maxlength: 8 },
  stop_limit: { type: Number, required: false, default: 0.0 },
  leverage: { type: Number, required: true, default: 5 },
  required_margin: { type: Number, required: true },
  usedUSDT: { type: Number, required: false, default: null, maxlength: 8 },
  close_price: { type: Number, required: false },
  close_time: { type: Date },
  fee: {type: Number, default : 0.0},
  liqPrice: { type: Number, required: false, default: 0.0 },
  adjusted: { type: Number, required: false, default: 0.0 },
  pnl: { type: Number, default: 0.0, required: false, maxlength: 8 },
  status: { type: Number, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FutureOrder", FutureOrderSchema);
