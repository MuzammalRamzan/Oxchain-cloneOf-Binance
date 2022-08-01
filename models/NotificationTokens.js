const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const NotificationTokenSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  token_id: { type: String, required: true },
  status: { type: String, required: false, default: 1 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NotificationToken", NotificationTokenSchema);
