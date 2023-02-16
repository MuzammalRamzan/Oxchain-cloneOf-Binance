const mongoose = require('mongoose');

const AcademySchema = new mongoose.Schema({
  author: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: Number, required: false, default: 1 },
  coverPhoto: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'altcoin',
      'binance',
      'bitcoin',
      'blockchain',
      'consensus',
      'cryptography',
      'defi',
      'economics',
      'essentials',
      'ethereum',
      'history',
      'metaverse',
      'mining',
      'nft',
      'tech',
    ],
  },
  dificulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  timeDuration: { type: Number },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('Academy', AcademySchema);
