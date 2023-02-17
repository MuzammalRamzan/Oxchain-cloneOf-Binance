const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  author: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: Number, required: false, default: 1 },
  coverPhoto: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['business', 'markets', 'technology', 'policy'],
  },
  is_top: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('News', NewsSchema);
