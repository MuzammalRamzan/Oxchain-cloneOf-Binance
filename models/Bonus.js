const mongoose = require("mongoose");

const BonusSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    description: {type: String, required : false},
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'BonusTypes', required: true },
    status: { type: Number, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiration: {type: Date, required : false},

});

module.exports = mongoose.model("Bonus", BonusSchema);
