const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');
const CoinList = require('../../models/CoinList');

var authFile = require('../../auth.js');

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

		if (req.body.interval === '5m') {
			timeInMs = 5 * 60 * 1000; // 5 minutes in milliseconds
		} else if (req.body.interval === '1h') {
			timeInMs = 60 * 60 * 1000; // 1 hour in milliseconds
		} else {
			// handle invalid interval value
		}
		let thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		let predictionHistoryData = await PredictionHistory.find({
			coin_symbol: req.body.coin_symbol,
			createdAt: { $gte: thirtyDaysAgo },
			interval: req.body.interval,
		}).sort({ createdAt: 1 });
		if (!predictionHistoryData.length) {
			return res.status(404).json({
				status: 'fail',
				message: 'Prediction Data Not found',
				showableMessage: 'Prediction Data Not found',
			});
		}
		//To get no of successfull predictions
		let noOfSuccessfullPredictions = await PredictionHistory.countDocuments({
			coin_symbol: req.body.coin_symbol,
			createdAt: { $gte: thirtyDaysAgo },
			interval: req.body.interval,
			prediction: 1,
		});
		let coinInfo;
		if (req.body.coin_symbol !== 'XRP') {
			coinInfo = await CoinList.findOne({
				symbol: req.body.coin_symbol,
			});
		}
		let predictionData = await Prediction.find({
			coin_symbol: req.body.coin_symbol,
			interval: req.body.interval,
		})
			.sort({ createdAt: -1 })
			.limit(1);
		if (!predictionData.length) {
			return res.status(404).json({
				status: 'fail',
				message: 'No pending prediction found!',
				showableMessage: 'No pending prediction found!',
			});
		}

		let dataArray = [];
		for (let i = 0; i < predictionHistoryData.length - 1; i++) {
			let data = predictionHistoryData[i];

			let nextData = predictionHistoryData[i + 1];
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

			if (data.prediction == 1) {
				if (data.price < nextData.price) {
					dataArray.push({
						prediction: data.prediction,
						price: nextData.price,
						timeInterval,
						isSuccess: false,
					});
				} else {
					dataArray.push({
						prediction: data.prediction,
						price: nextData.price,
						timeInterval,
						isSuccess: true,
					});
				}
			}

			if (data.prediction == 0) {
				if (data.price > nextData.price) {
					dataArray.push({
						prediction: data.prediction,
						isSuccess: false,
						timeInterval,
						price: nextData.price,
					});
				} else {
					dataArray.push({
						prediction: data.prediction,
						isSuccess: true,
						timeInterval,
						price: nextData.price,
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
		let pendingEndTime = new Date(pendingEndTimestamp).toLocaleTimeString([], {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
		});
		let interval = `${pendingStartTime}-${pendingEndTime}`;

		console.log(interval); // Output: 18:30-19:30

		dataArray.push({
			prediction: predictionData[0].prediction,
			price: predictionData[0].price,
			timeInterval: interval,
			isSuccess: 'pending',
		});
		let accuracy =
			(noOfSuccessfullPredictions / predictionHistoryData.length) * 100;
		if (!accuracy) {
			accuracy = 0;
		}
		return res.json({
			status: 'success',
			data: {
				data: dataArray,
				symbol: coinInfo?.symbol,
				coinUrl: coinInfo?.image_url,
				noOfSuccessfullPredictions,
				totalPredictions: predictionHistoryData.length,
				accuracy,
			},
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
