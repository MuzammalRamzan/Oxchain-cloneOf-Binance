const mongoose = require("mongoose");

const FeeModelSchema = new mongoose.Schema({
  feeType: { type: String, required: true },
  amount: { type: Number, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "User"},
  pair_id: { type: mongoose.Schema.Types.ObjectId, required: true , ref : "Pairs"},
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FeeModel", FeeModelSchema);
