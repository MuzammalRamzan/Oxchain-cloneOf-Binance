const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const PairsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbolOne: { type: String, required: true },
  symbolOneID: { type: String, required: true },
  symbolTwo: { type: String, required: true },
  symbolTwoID: { type: String, required: true },
  type: { type: String, required: true },
  digits: { type: String, required: true },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

PairsSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Pairs", PairsSchema);
