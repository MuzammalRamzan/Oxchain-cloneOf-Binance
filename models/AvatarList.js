const mongoose = require('mongoose');

const AvatarList = new mongoose.Schema({
	url: { type: String, required: true },
	status: { type: Number, required: false, default: 1 },
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('AvatarList', AvatarList);
