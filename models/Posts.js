const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
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
	category: {
		type: String,
		enum: ['news', 'dashboardNews', 'blogs'],
		required: true,
	},
	status: {
		type: Number,
		default: 1,
	},
});
postSchema.index({ title: 'text', content: 'text', author: 'text' });
module.exports = mongoose.model('Posts', postSchema);
