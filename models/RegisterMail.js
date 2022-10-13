const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const RegisterMailSchema = new mongoose.Schema({
  email: { type: String, required: true },
  pin: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: { type: String, required: false, default: "0" },
});

module.exports = mongoose.model("RegisterMail", RegisterMailSchema);
