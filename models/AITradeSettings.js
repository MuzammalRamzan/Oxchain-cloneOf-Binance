const mongoose = require("mongoose");

const AITradeSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    balance: { type: Number, required: false, default: 0 },
    coin_balance: { type: Number, required: false, default: 0 },
    maxLose: { type: Number, required: false, default: 0 },
    maxProfit: { type: Number, required: false, default: 0 },
    pair: { type: String, required: true },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("AITradeSettings", AITradeSchema);
