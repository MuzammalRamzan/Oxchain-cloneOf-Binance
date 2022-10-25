const mongoose = require("mongoose");

const NetworkSchema = new mongoose.Schema({
  title: { type: String, required: false, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Network", NetworkSchema);
