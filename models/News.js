const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	author: {
		type: String,
		required: true,
	},
	coverPhoto: {
		type: String,
		required: true,
	},
	status: {
		type: Number,
		default: 1,
	},
});

module.exports = mongoose.model('News', newsSchema);
