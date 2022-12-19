const mongoose = require("mongoose");

const MarketingMailSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    status: { type: String, required: false, default: 1 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("MarketingMails", MarketingMailSchema);
