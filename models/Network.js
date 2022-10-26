const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const NetworkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("Network", NetworkSchema);
