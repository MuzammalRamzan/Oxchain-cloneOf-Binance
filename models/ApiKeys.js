const mongoose = require("mongoose");

const ApiKeySchema = new mongoose.Schema({
    api_key: { type: String, required: true },
    user_id: { type: String, required: true },
    trade: { type: String, required: true },
    deposit: { type: String, required: true },
    withdraw: { type: String, required: true },
    transfer: { type: String, required: true },
    get_balance: { type: String, required: true },
    futures: { type: String, required: true },
    tag: { type: String, required: true },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("ApiKeys", ApiKeySchema);