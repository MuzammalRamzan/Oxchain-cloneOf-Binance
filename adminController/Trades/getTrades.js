const Wallet = require('../../models/Wallet');
const FutureWalletModel = require('../../models/FutureWalletModel');
const MarginIsolated = require('../../models/MarginIsolatedWallet');
const MarginCross = require('../../models/MarginCrossWallet');
var authFile = require('../../auth.js');
const getTrade = (model) => {
	// Find all documents in the provided model
	return (
		model
			.find({})
			// Select the specified fields from the documents
			.select('coin_id user_id amount type pnl createdAt')
			// Populate the user_id and coin_id fields with the corresponding User and CoinList documents
			// Select the specified fields from the populated documents
			.populate([
				{
					path: 'user_id',
					model: 'User',
					select: 'name surname email -_id',
				},
				{
					path: 'coin_id',
					model: 'CoinList',
					select: 'symbol -_id',
				},
			])
	);
};

const getTrades = async (req, res) => {
	try {
		// Destructure the request body to get the type and apiKey
		const { type, apiKey } = req.body;

		// Check if the provided apiKey is valid
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		// Initialize an empty array to store the trades
		let trades = [];

		// Object containing the different trade models
		const tradeModels = {
			spot: Wallet,
			future: FutureWalletModel,
			margin_isolated: MarginIsolated,
			margin_cross: MarginCross,
		};

		// If no type is provided
		if (!type) {
			// Create an array of promises for each model type
			const promises = Object.keys(tradeModels).map(async (modelType) => {
				return await getTrade(tradeModels[modelType]);
			});
			// Wait for all promises to resolve
			trades = await Promise.all(promises);
			// Flatten the array of arrays into a single-level array
			trades = [].concat.apply([], trades);
		} else {
			// If a type is provided, get the trades for that model
			trades = await getTrade(tradeModels[type]);
		}

		// If no trades are found
		if (!trades.length) {
			return res.status(404).json({
				status: 'fail',
				message: 'not found',
				showableMessage: 'No trade found',
			});
		}
		// Return the trades as a success response
		return res.status(200).json({
			status: 'success',
			message: 'Trades data',
			data: trades,
		});
	} catch (error) {
		// Return an error response if there is an exception
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = getTrades;
