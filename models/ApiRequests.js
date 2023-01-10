const mongoose = require("mongoose");

const ApiRequestsSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    request: { type: String, required: true },
    ip: { type: String, required: true },
    api_key: { type: String, required: true },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("ApiRequest", ApiRequestsSchema);