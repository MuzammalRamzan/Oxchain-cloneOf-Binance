const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const AITradeParticipants = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    method: { type: String, required: true }, //buy-sell
    type: { type: String, required: true }, //cross-isolated
    period: { type: String, required: true }, //5m-1h
    leverage: { type: Number, required: true, default: 1.0 }, //5m-1h
    closeType : {type : String, required : true}, //
    sl: { type: Number, required: false, default: 0 },
    tp: { type: Number, required: false, default: 0 },
    maxOrder: { type: Number, required: false, default: null },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("AITradeParticipants", AITradeParticipants);
