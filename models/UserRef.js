const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const UserRef = new mongoose.Schema({
  user_id: { type: String, required: true },
  refCode: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserRef", UserRef);
