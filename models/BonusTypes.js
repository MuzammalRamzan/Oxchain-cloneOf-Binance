const mongoose = require("mongoose");

const BonusTypesSchema = new mongoose.Schema({
  title: { type: String ,required: true },
  amount: { type: Number, required: true },
  add_type: { type: String, required: true },
  description: {type: String, required : false},
  status: { type: Number, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BonusTypes", BonusTypesSchema);
