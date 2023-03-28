const mongoose = require("mongoose");

const QRCodes = new mongoose.Schema({
    deviceId: { type: String, required: false },
    deviceName: { type: String, required: false },
    deviceType: { type: String, required: false },
    deviceOs: { type: String, required: false },
    deviceVersion: { type: String, required: false },
    ip: { type: String, required: true }, 
    location: { type: String, required: false }, 
    qrToken: {type: String, required: true},
    status: {type: String, required: true, default:0},
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("QRCodes", QRCodes);
