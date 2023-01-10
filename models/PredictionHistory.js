const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
    prediction: { type: String, required: true },
    coin_symbol: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("PredictionHistory", PredictionSchema);
