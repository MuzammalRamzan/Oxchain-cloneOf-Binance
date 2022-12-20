const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const RegisteredAddress = new mongoose.Schema({
  user_id: { type: String, required: true },
  coin_id: { type: String, required: true },
  address: { type: String, required: true },
  tag: { type: String, required: false },
  whiteListed: { type: Boolean, default: false },
  type: { type: String, default: "standard" },
  label: { type: String, required: false },
  origin: { type: String, required: false },
  network: { type: String, required: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RegisteredAddress", RegisteredAddress);
