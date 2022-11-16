const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const FutureWalletModelSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    coin_id: { type: String, required: true },
    amount: { type: Number, required: true, default: 0.00 },
    symbol : {type: String, required: true },
    type: { type: String, required: true },
    pnl: { type: Number, required: false, default: 0.0 },
    totalBonus: { type: Number, required: false, default: 0.0 },
    status: { type: String, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

FutureWalletModelSchema.plugin(uniqueValidator);

module.exports = mongoose.model("FutureWalletModel", FutureWalletModelSchema);
