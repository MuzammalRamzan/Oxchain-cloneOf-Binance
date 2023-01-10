const mongoose = require("mongoose");

const SkipDepositsScheme = new mongoose.Schema({
    network_id : {type : mongoose.Schema.Types.ObjectId, ref: "Networks"},
    tx_id : {type: String}
});
module.exports = mongoose.model("SkipDeposits", SkipDepositsScheme);
