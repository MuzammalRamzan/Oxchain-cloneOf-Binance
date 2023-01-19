const { default: mongoose } = require("mongoose");

const TradeVolumeModel = new mongoose.Schema({
    order_id: { type: String, required: true },
    trade_from: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    trade_type: { type: String, required: true },
    amount: { type: Number, required: true },
    totalUSDT : {type: Number, required: true}

});

module.exports = mongoose.model("TradeVolume", TradeVolumeModel);