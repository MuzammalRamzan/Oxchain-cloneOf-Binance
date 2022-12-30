const mongoose = require("mongoose");

const RecidencyModelSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    url: { type: String, required: true },
    url2: { type: String, required: false },
    status: { type: String, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("RecidencyModel", RecidencyModelSchema);
