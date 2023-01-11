const mongoose = require('mongoose');

const WalletAddressesSchema = new mongoose.Schema({
	user_id: { type: Number, required: true },
	network_id: { type: Number, required: true },
	currency_id: { type: Number, required: true },
	contract: { type: String, required: true },
	address: { type: String, required: true },
	pkey: { type: String, required: true },
	balance: { type: Number, required: false, default: 0.0 },

	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('WalletAddresses', WalletAddressesSchema);
