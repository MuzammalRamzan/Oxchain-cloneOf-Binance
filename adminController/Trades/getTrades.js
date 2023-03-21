const Wallet = require('../../models/Wallet');
const User = require('../../models/User');
const FutureWalletModel = require('../../models/FutureWalletModel');
const MarginIsolated = require('../../models/MarginIsolatedWallet');
const MarginCross = require('../../models/MarginCrossWallet');
var authFile = require('../../auth.js');
const mongoose = require('mongoose');

const getTrade = (model, page, perPage) => {
	// Calculate the number of items to skip based on the current page number and items per page
	const skip = (page - 1) * perPage;

	// Find all documents in the provided model, skipping the appropriate number of items based on the current page number
	return (
		model
			.find({})
			.skip(skip)
			.limit(perPage)
			// Select the specified fields from the documents
			.select('user_id amount type pnl createdAt coin_id')
			// Populate the coin_id field with the corresponding CoinList document
			.populate([
				{
					path: 'coin_id',
					model: 'CoinList',
					select: 'symbol -_id',
				},
			])
			.then(async (trades) => {
				// Use Promise.all() to await all User.findOne() calls
				const users = await Promise.all(
					trades.map((trade) =>
						User.findOne({
							_id: mongoose.Types.ObjectId(trade.user_id),
						})
					)
				);

				// Map over the trades and extract the necessary fields
				return trades.map((trade, index) => {
					const user = users[index];
					return {
						symbol: trade?.coin_id?.symbol,
						user_id: trade?.user_id,
						user: user ? [user.name, user.surname, user.email] : null,
						amount: trade?.amount,
						type: trade?.type,
						pnl: trade?.pnl,
						createdAt: trade?.createdAt,
						deleted_user: user === null,
					};
				});
			})
	);
};

const getTrades = async (req, res) => {
	try {
		// Destructure the request body to get the type and apiKey
		const { type, apiKey, page, recordPerPage } = req.body;

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
				return await getTrade(tradeModels[modelType], page, recordPerPage);
			});
			// Wait for all promises to resolve
			trades = await Promise.all(promises);
			// Flatten the array of arrays into a single-level array
			trades = [].concat.apply([], trades);
		} else {
			// If a type is provided, get the trades for that model
			trades = await getTrade(tradeModels[type], page, recordPerPage);
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
