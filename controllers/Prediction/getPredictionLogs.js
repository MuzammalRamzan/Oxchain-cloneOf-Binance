const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');
var authFile = require('../../auth.js');

const log = async (req, res) => {
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
		// handle invalid interval value
	}
	let coinCheck = await Prediction.find({}).sort({ createdAt: -1 });

	//get different coin symbols from prediction history
	let coinSymbols = [];
	for (let i = 0; i < coinCheck.length; i++) {
		let data = coinCheck[i];
		if (!coinSymbols.includes(data.coin_symbol)) {
			coinSymbols.push(data.coin_symbol);
		}
	}

	console.log(coinSymbols);

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
		let pendingEndTime = new Date(pendingEndTimestamp).toLocaleTimeString([], {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
		});
		let interval = `${pendingStartTime}-${pendingEndTime}`;
		foreachPredictionData.push({
			prediction: predictionData[0].prediction,
			price: predictionData[0].price,
			interval,
			isSuccess: 'pending',
		});

		generalDataArray.push({
			coin_symbol: coinSymbols[i],
			data: foreachPredictionData,
		});
	}

	return res.json({
		status: 'success',
		data: generalDataArray,
	});
};

module.exports = log;
