const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');
var authFile = require('../../auth.js');
const CoinList = require('../../models/CoinList');

const log = async (req, res) => {
	try {
		// validate API KEY
		if (!await authFile.apiKeyChecker(req.body.api_key)) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		// validate interval
		if (!['5m', '1h'].includes(req.body.interval)) {
			return res.status(400).json({
				status: 'fail',
				message: '400 Bad Request',
				showableMessage: 'Given interval is incorrect.',
			});
		}

		// get now - 30 days.
		let thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		
		// get coin symbol available in history data or just write in an array or take from request.body
		let coinSymbols = [];
		if(req.body.coin_symbol){
			coinSymbols = [req.body.coin_symbol];
		}else{
			// let coinSymbols = await PredictionHistory.distinct("coin_symbol");
			coinSymbols = ['BTC'];
		}
		
		// preparing data for response
		let predictionDataResponse = [];
		for (let i = 0; i < coinSymbols.length; i++) {
	
			// getting last 4 predication for display cards.
			let predictionHistoryData = await PredictionHistory.find({
				coin_symbol: coinSymbols[i],
				interval: req.body.interval,
			})
			.sort({ createdAt: -1 }).limit(4);

			// add data to array if records available
			if(predictionHistoryData.length > 0){
				// getting coin data for image url
				let coinInfo = await CoinList.findOne({
					symbol: coinSymbols[i],
				});

				// number of success predictions in last 30 days
				let noOfSuccessfullPredictions = await PredictionHistory.countDocuments({
					coin_symbol: coinSymbols[i],
					createdAt: { $gte: thirtyDaysAgo },
					interval: req.body.interval,
					isSuccess: "1",
				});
				// total number of predication in last 30 days
				let totalNumberOfPredication = await PredictionHistory.countDocuments({
					coin_symbol: coinSymbols[i],
					createdAt: { $gte: thirtyDaysAgo },
					interval: req.body.interval,
				});

				// finding accurancy in percentage
				let accuracy = Math.round((noOfSuccessfullPredictions / totalNumberOfPredication) * 100);

				predictionDataResponse.push({
					coin_symbol: coinSymbols[i],
					coinUrl: coinInfo.image_url,
					noOfSuccessfullPredictions,
					totalPredictions: totalNumberOfPredication,
					accuracy,
					data: predictionHistoryData.sort(),
				});
			}else{
				return res.status(404).json({
					status: 'fail',
					message: 'data not found',
					showableMessage: 'No predication available for this coin',
				});
			}
		}
		return res.json({
			status: 'success',
			data: predictionDataResponse,
		});
	} catch (error) {
		// Log the error for debugging purposes
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = log;
