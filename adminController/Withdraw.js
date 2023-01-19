const WithdrawModel = require('../models/Withdraw');
const authFile = require('../auth.js');
const User = require('../models/User');
const CoinList = require('../models/CoinList');
const withdrawFund = require('./withdrawFund');
const withdrawReport = require('./withdrawFundReport');
const userWithdraws = async (req, res) => {
	const apiKey = req.body.apiKey;
	const userId = req.body.userId;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const withdraws = await WithdrawModel.find({ user_id: userId }).lean();
	for (let i = 0; i < withdraws.length; i++) {
		let userData = await User.findOne({ _id: withdraws[i].user_id });
		withdraws[i].user = userData;

		let coinData = await CoinList.findOne({ _id: withdraws[i].coin_id });
		withdraws[i].coin = coinData;
	}

	return res.json({ status: 'success', data: withdraws });
};

const listWithdraws = async (req, res) => {
	const apiKey = req.body.apiKey;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const withdraws = await WithdrawModel.find({}).lean();

	for (let i = 0; i < withdraws.length; i++) {
		let userData = await User.findOne({ _id: withdraws[i].user_id });
		withdraws[i].user = userData;

		let coinData = await CoinList.findOne({ _id: withdraws[i].coin_id });
		withdraws[i].coin = coinData;
	}

	return res.json({ status: 'success', data: withdraws });
};
const totalWithdrawn = async (req, res) => {
	const status = req.query.status;
	const apiKey = req.body.apiKey;
	let totalUSDDeposited = 0;
	if (!status) {
		return res.status(400).send({
			message: 'status is required',
		});
	}
	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });
	const data = await withdrawFund(status);
	console.log('data', data);
	for (let i = 0; i < data.length; i++) {
		if (data[i].symbol === 'Margin') continue;
		if (data[i].symbol === 'USDT') {
			totalUSDDeposited += parseFloat(data[i].availableBalance);
		} else {
			totalUSDDeposited += parseFloat(data[i].usdtValue);
		}
	}
	return res.json({ status: 'success', totalUSDDeposited });
};
const totalWithdrawGraphData = async (req, res) => {
	const apiKey = req.body.apiKey;
	let graphData = [];
	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });
	const data = await withdrawReport();
	console.log('data', data);
	for (let i = 0; i < data.length; i++) {
		if (data[i].symbol === 'Margin') continue;
		if (data[i].symbol === 'USDT') {
			graphData.push({
				USD: data[i].availableBalance,
				date: data[i].date,
			});
		} else {
			graphData.push({
				USD: data[i].usdtValue,
				date: data[i].date,
			});
		}
	}
	return res.json({ status: 'success', graphData });
};
module.exports = {
	userWithdraws,
	listWithdraws,
	totalWithdrawn,
	totalWithdrawGraphData,
};
