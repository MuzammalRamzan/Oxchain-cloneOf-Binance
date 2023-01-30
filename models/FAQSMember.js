const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FAQSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		match:
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	},
	phone: {
		type: String,
		required: true,
		match: /^[0-9]{10,12}$/,
	},
	status: {
		type: String,
		enum: ['active', 'inactive'],
		default: 'active',
	},
});

module.exports = mongoose.model('FAQMember', FAQSchema);
