const Wallet = require('../../models/Wallet');
const User = require('../../models/User');
const FutureWalletModel = require('../../models/FutureWalletModel');
const MarginIsolated = require('../../models/MarginIsolatedWallet');
const MarginCross = require('../../models/MarginCrossWallet');
var authFile = require('../../auth.js');
const mongoose = require('mongoose');
const getTrade = async (model, page, perPage) => {
	try {
		// Calculate the total number of trades
		const totalTrades = await model.countDocuments();

		// Calculate the number of items to skip based on the current page number and items per page
		const skip = (page - 1) * perPage;

		// Find all documents in the provided model, skipping the appropriate number of items based on the current page number
		const trades = await model
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
			]);

		// Use Promise.all() to await all User.findOne() calls
		const users = await Promise.all(
			trades.map((trade) =>
				User.findOne({
					_id: mongoose.Types.ObjectId(trade.user_id),
				})
			)
		);

		// Map over the trades and extract the necessary fields
		const mappedTrades = trades.map((trade, index) => {
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

		// Calculate the total number of pages
		const totalPages = Math.ceil(totalTrades / perPage);

		return {
			trades: mappedTrades,
			totalPages: totalPages,
			totalRecords: totalTrades,
		};
	} catch (error) {
		throw error;
	}
};
// const getTrades = async (req, res) => {
// 	try {
// 		// Destructure the request body to get the type and apiKey
// 		const { type, apiKey, page, recordPerPage } = req.body;

// 		// Check if the provided apiKey is valid
// 		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
// 		if (!isAuthenticated) {
// 			return res.status(403).json({
// 				status: 'fail',
// 				message: '403 Forbidden',
// 				showableMessage: 'Forbidden 403, Please provide valid api key',
// 			});
// 		}

// 		// Object containing the different trade models
// 		const tradeModels = {
// 			spot: Wallet,
// 			future: FutureWalletModel,
// 			margin_isolated: MarginIsolated,
// 			margin_cross: MarginCross,
// 		};

// 		// If no type is provided
// 		if (!type) {
// 			// Create an array of promises for each model type
// 			const promises = Object.keys(tradeModels).map(async (modelType) => {
// 				return await getTrade(tradeModels[modelType], page, recordPerPage);
// 			});
// 			// Wait for all promises to resolve
// 			let trades = await Promise.all(promises);
// 			// Flatten the array of arrays into a single-level array
// 			trades = [].concat.apply([], trades);

// 			// Calculate the total number of pages based on the first trade type
// 			const totalPages = trades[0] ? trades[0].totalPages : 0;
// 			const totalRecords = trades[0] ? trades[0].totalRecords : 0;

// 			// Return the trades as a success response
// 			return res.status(200).json({
// 				status: 'success',
// 				message: 'Trades data',
// 				data: trades,
// 				totalPages: totalPages,
// 				totalRecords: totalRecords,
// 			});
// 		} else {
// 			// If a type is provided, get the trades for that model
// 			const result = await getTrade(tradeModels[type], page, recordPerPage);

// 			// Return the trades as a success response
// 			return res.status(200).json({
// 				status: 'success',
// 				message: 'Trades data',
// 				data: result.trades,
// 				totalPages: result.totalPages,
// 				totalRecords: result.totalRecords,
// 			});
// 		}
// 	} catch (error) {
// 		// Return an error response if there is an exception
// 		return res.status(500).json({
// 			status: 'fail',
// 			message: 'Internal Server Error',
// 			showableMessage: error.message,
// 		});
// 	}
// };
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
			const trades = await Promise.all(promises);

			// Calculate the total number of pages and total records for each type
			let totalPages = 0;
			let totalRecords = 0;
			trades.forEach((trade) => {
				totalPages += trade.totalPages;
				totalRecords += trade.totalRecords;
			});

			// Flatten the array of arrays into a single-level array
			const flattenedTrades = trades.reduce(
				(acc, val) => acc.concat(val.trades),
				[]
			);

			// Return the trades as a success response
			return res.status(200).json({
				status: 'success',
				message: 'Trades data',
				data: flattenedTrades,
				totalPages: totalPages,
				totalRecords: totalRecords,
			});
		} else {
			// If a type is provided, get the trades for that model
			const result = await getTrade(tradeModels[type], page, recordPerPage);

			// Return the trades as a success response
			return res.status(200).json({
				status: 'success',
				message: 'Trades data',
				data: result.trades,
				totalPages: result.totalPages,
				totalRecords: result.totalRecords,
			});
		}
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
