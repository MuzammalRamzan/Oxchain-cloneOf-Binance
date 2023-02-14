const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema({
  // addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedBy: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: Number, required: false, default: 1 },
  category: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("News", NewsSchema);
