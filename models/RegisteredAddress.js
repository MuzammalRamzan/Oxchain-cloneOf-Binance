const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const RegisteredAddress = new mongoose.Schema({
  user_id: { type: String, required: true },
  coin_id: { type: String, required: true },
  address: { type: String, required: true },
  tag: { type: String, required: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RegisteredAddress", RegisteredAddress);
