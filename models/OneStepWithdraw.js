const mongoose = require("mongoose");

const OneStepWithdrawSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  amount: {type: [Number], required: false},
  status: { type: Number, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OneStepWithdraw", OneStepWithdrawSchema);
