const mongoose = require("mongoose");

const CopyTradeSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  spotTradeAuth: { type: String, required: true },
  marginTradeAuth: { type: String, required: true },
  traderId: { type: String, required: true },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CopyTrade", CopyTradeSchema);
