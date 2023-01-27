const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FaqSchema = new Schema({
	question: {
		type: String,
		required: true,
	},
	answer: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		required: true,
	},
	keywords: [String],
	date_created: {
		type: Date,
		default: Date.now,
	},
	date_updated: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('FAQs', FaqSchema);
