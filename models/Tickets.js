const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const SupportTickets = new mongoose.Schema({
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("SupportTickets", SupportTickets);
