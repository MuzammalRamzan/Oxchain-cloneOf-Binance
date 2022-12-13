const mongoose = require("mongoose");

const OneStepWithdrawSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  dayLimit: { type: Number, required: false },
  oneStepQuota: { type: Number, required: false },
  maxAmount: { type: Number, required: false, default: 500 },
  status: { type: Number, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OneStepWithdraw", OneStepWithdrawSchema);
