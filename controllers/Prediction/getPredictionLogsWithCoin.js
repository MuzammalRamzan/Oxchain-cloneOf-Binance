const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');

const log = async (req, res) => {
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
	//To get no of successfull predictions
	let noOfSuccessfullPredictions = await PredictionHistory.countDocuments({
		coin_symbol: req.body.coin_symbol,
		createdAt: { $gte: thirtyDaysAgo },
		interval: req.body.interval,
		prediction: 1,
	});

	let predictionData = await Prediction.find({
		coin_symbol: req.body.coin_symbol,
		interval: req.body.interval,
	})
		.sort({ createdAt: -1 })
		.limit(1);

	let dataArray = [];
	for (let i = 0; i < predictionHistoryData.length - 1; i++) {
		let data = predictionHistoryData[i];

		let nextData = predictionHistoryData[i + 1];

		let startTime = new Date(data.createdAt).toLocaleTimeString();
		let endTimeStamp = new Date(data.createdAt).getTime() + timeInMs;
		let endTime = new Date(endTimeStamp).toLocaleTimeString();
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
	console.log(new Date(predictionData[0].createdAt).getTime());
	let pendingStartTime = new Date(
		predictionData[0].createdAt
	).toLocaleTimeString();
	let pendingEndTimestamp =
		new Date(predictionData[0].createdAt).getTime() + timeInMs;
	let pendingEndTime = new Date(pendingEndTimestamp).toLocaleTimeString();
	let interval = `${pendingStartTime}-${pendingEndTime}`;

	dataArray.push({
		prediction: predictionData[0].prediction,
		price: predictionData[0].price,
		timeInterval: interval,
		isSuccess: 'pending',
	});
	return res.json({
		status: 'success',
		data: {
			data: dataArray,
			noOfSuccessfullPredictions,
			totalPredictions: predictionHistoryData.length,
			accuracy:
				(noOfSuccessfullPredictions / predictionHistoryData.length) * 100,
		},
	});
};

module.exports = log;
