const mongoose = require("mongoose");

const CopyLeaderSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CopyLeader", CopyLeaderSchema);
