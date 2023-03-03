const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
    prediction: { type: String, required: true },
    coin_symbol: { type: String, required: true },
    price: { type: Number, required: true },
    interval: { type: String, required: true },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Prediction", PredictionSchema);
