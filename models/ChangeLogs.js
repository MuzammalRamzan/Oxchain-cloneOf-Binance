const mongoose = require("mongoose");

const ChangeLogsSchema = new mongoose.Schema({
    user_id: { type: String, required: false },
    type: { type: String, required: false },
    ip: { type: String, required: false },
    device: { type: String, required: false },
    city: { type: String, required: false },
    deviceOS: { type: String, required: false },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("ChangeLogs", ChangeLogsSchema);

