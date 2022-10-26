const mongoose = require("mongoose");

const BonusSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required: true },
  amount: { type: String, required: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref:'BonusTypes', required: true },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Bonus", BonusSchema);
