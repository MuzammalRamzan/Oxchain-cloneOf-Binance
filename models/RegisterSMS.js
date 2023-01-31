const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const RegisterSMSSchema = new mongoose.Schema({
  phone_number: { type: String, required: true },
  pin: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: { type: String, required: false, default: "0" },
  expiryTime: { type: Date, default: Date.now }

});

module.exports = mongoose.model("RegisterSMS", RegisterSMSSchema);
