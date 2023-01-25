const mongoose = require('mongoose');

const supportTeamSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	image: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		required: true,
		default: '1',
	},
	publishAt: {
		type: Date,
		default: Date.now(),
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	},
});

module.exports = mongoose.model('SupportTeam', supportTeamSchema);
