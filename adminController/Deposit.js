const DepositModel = require('../models/Deposits');
const authFile = require('../auth.js');
const User = require('../models/User');
const depositFund = require('./depositFund');
const depositReport = require('./depositReport');
const userDeposits = async (req, res) => {
	const apiKey = req.body.apiKey;
	const userId = req.body.userId;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const deposits = await DepositModel.find({ user_id: userId }).lean();

	for (let i = 0; i < deposits.length; i++) {
		let userData = await User.findOne({ _id: deposits[i].user_id });
		deposits[i].user = userData;
	}
	return res.json({ status: 'success', data: deposits });
};

const listDeposits = async (req, res) => {
	const apiKey = req.body.apiKey;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const deposits = await DepositModel.find({}).lean();

	return res.json({
		status: 'success',
		data: deposits,
		totalDeposits: deposits.length,
	});
};

const totalDeposits = async (req, res) => {
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
	const data = await depositFund(status);
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

const totalDepositGraphData = async (req, res) => {
	const apiKey = req.body.apiKey;
	let graphData = [];
	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });
	const data = await depositReport();
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
	userDeposits,
	listDeposits,
	totalDeposits,
	totalDepositGraphData,
};
