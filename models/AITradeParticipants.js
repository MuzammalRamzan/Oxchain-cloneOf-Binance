const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const AITradeParticipants = new mongoose.Schema({
    pair: { type: String, required: true },
    method: { type: String, required: true }, //buy-sell
    type: { type: String, required: true }, //cross-isolated
    time: { type: String, required: true }, //5m-1h
    user_id: { type: String, required: true },
    maxOrder: { type: Number, required: false, default: null },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("AIFutureSchema", AIFutureModelSchema);
