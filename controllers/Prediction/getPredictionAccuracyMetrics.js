const PredictionHistory = require('../../models/PredictionHistory');
var authFile = require('../../auth.js');

const log = async (req, res) => {
	const { coin_symbol, interval, api_key } = req.body;

	const isAuthenticated = await authFile.apiKeyChecker(api_key);
	if (!isAuthenticated) {
		return res.status(403).json({
			status: 'fail',
			message: '403 Forbidden',
			showableMessage: 'Forbidden 403, Please provide valid api key',
		});
	}
	if (!coin_symbol || coin_symbol === undefined) {
		return res.status(400).send({
			status: 'fail',
			message: 'coin_symbol parameter is missing',
			showableMessage: 'coin_symbol parameter is missing',
		});
	}
	//filter data according to timePeriod
	let timeFilter;
	switch (interval) {
		case '1D':
			timeFilter = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000);
			break;
		case '7D':
			timeFilter = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case '1M':
			timeFilter = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		case '3M':
			timeFilter = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000);
			break;
		case '6M':
			timeFilter = new Date(new Date().getTime() - 180 * 24 * 60 * 60 * 1000);
			break;
		default:
			timeFilter = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000);
			break;
	}

	let predictionHistoryData = await PredictionHistory.find({
		coin_symbol: coin_symbol,
		createdAt: {
			$gte: timeFilter,
		},
	}).sort({ createdAt: -1 });

	if (predictionHistoryData.length < 2) {
		return res.json({
			success: false,
			message: 'Not enough data to calculate accuracy metrics',
		});
	}
	let dates = [];
	let dataPoints = [];

	// Collect all unique dates
	for (let i = 0; i < predictionHistoryData.length; i++) {
		let data = predictionHistoryData[i];
		let dateOnlyDayAndMonthAndYear;

		if (interval === '1D') {
			dateOnlyDayAndMonthAndYear = data.createdAt
				.toISOString()
				.slice(0, 13)
				.replace('T', ' ');
		} else {
			dateOnlyDayAndMonthAndYear = data.createdAt.toISOString().split('T')[0];
		}

		if (!dates.includes(dateOnlyDayAndMonthAndYear)) {
			dates.push(dateOnlyDayAndMonthAndYear);
		}
	}

	// Create data points for each date
	console.log(predictionHistoryData.length);
	for (let i = 0; i < dates.length; i++) {
		let date = dates[i];
		let successCount = 0;
		let failureCount = 0;

		// Count success and failure predictions for the current date
		for (let j = 0; j < predictionHistoryData.length; j++) {
			let data = predictionHistoryData[j];
			let dataDate;

			if (interval === '1D') {
				dataDate = data.createdAt.toISOString().slice(0, 13).replace('T', ' ');
			} else {
				dataDate = data.createdAt.toISOString().split('T')[0];
			}

			if (dataDate === date) {
				if (data.isSuccess === '1') {
					successCount++;
				} else if (data.isSuccess === '0') {
					failureCount++;
				}
			}
		}

		// Create data point object for the current date
		dataPoints.push({
			date: date,
			successCount: successCount,
			failureCount: failureCount,
		});
	}

	return res.json({
		success: true,
		data: dataPoints,
	});
};

module.exports = log;
