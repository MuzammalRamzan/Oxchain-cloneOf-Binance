const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const OrdersSchema = new mongoose.Schema({
  pair_id: { type: String, required: true },
  pair_name: { type: String, required: true },
  type: { type: String, required: true },
  user_id: { type: String, required: true },
  amount: { type: Number, required: true },
  target_price: { type: Number, required: false },
  method: { type: String, required: true },
  stop_limit : {type : Number, required: false, default: 0.0},
  open_price: { type: Number, required: true },
  status: { type: Number, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("Orders", OrdersSchema);
