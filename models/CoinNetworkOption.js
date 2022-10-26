const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const CoinNetworkOptionSchema = new mongoose.Schema({
  coin_id:  { type: String, required: true, default: null },
  network_id : {type : String, required: true, default: null},
  status: { type: String, required: false, default: 1 },
  image_url: { type: String, required: false, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CoinNetworkOption", CoinNetworkOptionSchema);
