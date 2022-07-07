const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const SecuritySchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  key: { type: String, required: true },
  trade: { type: String, required: false, default: "no" },
  wallet: { type: String, required: false, default: "no" },
  deposit: { type: String, required: false, default: "no" },
  withdraw: { type: String, required: false, default: "no" },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("SecurityKey", SecuritySchema);
