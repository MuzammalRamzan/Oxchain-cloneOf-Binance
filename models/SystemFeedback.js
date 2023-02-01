const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const SystemFeedback = new mongoose.Schema({
    user_id: { type: String, required: true },
    rating: { type: Number, required: true },
    comments: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("SystemFeedback", SystemFeedback);
