const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blockedUserSchema = new Schema({
	reason: {
		type: String,
		required: true,
	},
	user_id: {
		type: String,
		required: true,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('BlockedUser', blockedUserSchema);
