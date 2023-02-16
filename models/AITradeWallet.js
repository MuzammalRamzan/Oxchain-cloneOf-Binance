const mongoose = require("mongoose");

const AITradeSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    enabled: { type: String, required: false, default: 0 },
    balance: { type: Number, required: false, default: 0.00 },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("AITradeWallet", AITradeSchema);
