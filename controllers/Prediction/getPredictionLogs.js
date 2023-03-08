const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');
var authFile = require('../../auth.js');
const CoinList = require('../../models/CoinList');

const log = async (req, res) => {
	try {
		const api_key = req.body.api_key;
		const isAuthenticated = await authFile.apiKeyChecker(api_key);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		let timeInMs;
		let thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		if (req.body.interval === '5m') {
			timeInMs = 5 * 60 * 1000; // 5 minutes in milliseconds
		} else if (req.body.interval === '1h') {
			timeInMs = 60 * 60 * 1000; // 1 hour in milliseconds
		} else {
			return res.status(400).json({
				status: 'fail',
				message: '400 Bad Request',
				showableMessage: 'Given interval is incorrect.',
			});
		}

		// get coin symbol available in history data or just write in an array.
		// let coinSymbols = await PredictionHistory.distinct("coin_symbol");
		let coinSymbols = ['BTC'];

		// preparing data for response
		let predictionDataResponse = [];
		for (let i = 0; i < coinSymbols.length; i++) {
	
			// getting last 4 predication for display cards.
			let predictionHistoryData = await PredictionHistory.find({
				coin_symbol: coinSymbols[i],
				interval: req.body.interval,
			})
			.sort({ createdAt: -1 }).limit(4);

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
			console.log(predictionHistoryData);

		}

		return res.status(200).json(predictionDataResponse);
		let generalDataArray = [];
		for (let i = 0; i < coinSymbols.length; i++) {
			let foreachPredictionData = [];
			let predictionHistoryData = await PredictionHistory.find({
				coin_symbol: coinSymbols[i],
				createdAt: { $gte: thirtyDaysAgo },
				interval: req.body.interval,
			})
				.sort({ createdAt: -1 })
				.limit(4);
			let noOfSuccessfullPredictions = await PredictionHistory.countDocuments({
				coin_symbol: coinSymbols[i],
				createdAt: { $gte: thirtyDaysAgo },
				interval: req.body.interval,
				prediction: 1,
			})
				.sort({ createdAt: -1 })
				.limit(4);
			console.log(noOfSuccessfullPredictions);

			let predictionData = await Prediction.find({
				coin_symbol: coinSymbols[i],
			})
				.sort({ createdAt: -1 })
				.limit(1);

			for (let i = 0; i < predictionHistoryData.length - 1; i++) {
				let data = predictionHistoryData[i];
				let startTime = new Date(data.createdAt).toLocaleTimeString([], {
					hour12: false,
					hour: '2-digit',
					minute: '2-digit',
				});
				let endTimeStamp = new Date(data.createdAt).getTime() + timeInMs;
				let endTime = new Date(endTimeStamp).toLocaleTimeString([], {
					hour12: false,
					hour: '2-digit',
					minute: '2-digit',
				});
				let timeInterval = `${startTime}-${endTime}`;
				let nextData = predictionHistoryData[i + 1];
				// console.log('coinInfo', coinInfo.symbol);
				if (data.prediction == 1) {
					if (data.price < nextData.price) {
						foreachPredictionData.push({
							prediction: data.prediction,
							price: nextData.price,
							timeInterval,
							isSuccess: false,
						});
					} else {
						foreachPredictionData.push({
							prediction: data.prediction,
							price: nextData.price,
							timeInterval,
							isSuccess: true,
						});
					}
				}

				if (data.prediction == 0) {
					if (data.price > nextData.price) {
						foreachPredictionData.push({
							prediction: data.prediction,
							isSuccess: false,
							price: nextData.price,
							timeInterval,
						});
					} else {
						foreachPredictionData.push({
							prediction: data.prediction,
							isSuccess: true,
							price: nextData.price,
							timeInterval,
						});
					}
				}
			}
			let pendingStartTime = new Date(
				predictionData[0].createdAt
			).toLocaleTimeString([], {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
			});
			let pendingEndTimestamp =
				new Date(predictionData[0].createdAt).getTime() + timeInMs;
			let pendingEndTime = new Date(pendingEndTimestamp).toLocaleTimeString(
				[],
				{
					hour12: false,
					hour: '2-digit',
					minute: '2-digit',
				}
			);
			let interval = `${pendingStartTime}-${pendingEndTime}`;
			foreachPredictionData.push({
				prediction: predictionData[0].prediction,
				price: predictionData[0].price,
				interval,
				isSuccess: 'pending',
			});
			if (coinSymbols[i] == 'XRP') continue;
			let coinInfo = await CoinList.findOne({
				symbol: coinSymbols[i],
			});
			let accuracy =
				(noOfSuccessfullPredictions / predictionHistoryData.length) * 100;
			if (!accuracy) {
				accuracy = 0;
			}

			generalDataArray.push({
				coin_symbol: coinSymbols[i],
				coinUrl: coinInfo.image_url,
				noOfSuccessfullPredictions,
				totalPredictions: predictionHistoryData.length,
				accuracy,
				data: foreachPredictionData,
			});
		}

		return res.json({
			status: 'success',
			data: generalDataArray,
		});
	} catch (error) {
		// Log the error for debugging purposes
		return res.status(500).json({
			status: 'Failed',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = log;
