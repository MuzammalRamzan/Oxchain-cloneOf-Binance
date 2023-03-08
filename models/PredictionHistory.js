const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
    prediction: { type: String, required: true },
    coin_symbol: { type: String, required: true },
    price: { type: Number, required: true },
    interval: { type: String, required: true },
    isSuccess: {type: String, required: true, default: 0},
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});
PredictionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});
module.exports = mongoose.model("PredictionHistory", PredictionSchema);
