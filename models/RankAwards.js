const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RankAwardSchema = new Schema({
	level: { type: String, required: true },
	imageUrl: { type: String, required: true },
	value: { type: String, required: true },
});

const RankAward = mongoose.model('RankAward', RankAwardSchema);

module.exports = RankAward;
