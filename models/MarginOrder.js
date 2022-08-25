const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const MarginOrderSchema = new mongoose.Schema({
  pair_id: { type: String, required: true },
  pair_name: { type: String, required: true },
  type: { type: String, required: true },
  margin_type: { type: String, required: true, default : 'cross' },
  user_id: { type: String, required: true },
  amount: { type: Number, required: true },
  isolated: { type: Number, required: false, default : 0.00 },
  open_price: { type: Number, required: true },
  open_time: { type: Date, default: Date.now },
  sl: { type: Number, required: false, default: 0.00 },
  tp: { type: Number, required: false, default: 0.00 },
  leverage : {type: Number, required : true, default : 5 },
  close_price: { type: Number, required: false },
  close_time: { type: Date}, 
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


module.exports = mongoose.model("MarginOrder", MarginOrderSchema);
