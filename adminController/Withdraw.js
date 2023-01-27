const WithdrawModel = require('../models/Withdraw');
const authFile = require('../auth.js');
const User = require('../models/User');
const CoinList = require('../models/CoinList');
const { withdrawFund } = require('./withdrawFund');
const withdrawReport = require('./withdrawFundReport');
const cryptoConvert = require('../controllers/GetUserBalances/SocketController/cryptoConvert');
const PDFDocument = require('pdfkit');
const userWithdraws = async (req, res) => {
	const { apiKey, userId } = req.body;
	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	if (!userId) return res.json({ status: 'error', message: 'userId is null' });
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
const exportWithdrawData = async (req, res) => {
	try {
		const {
			apiKey,
			userId,
			recordPerPage,
			dateFrom,
			dateTo,
			status,
			type,
			coin_id,
		} = req.body;
		if (!apiKey)
			return res.json({ status: 'error', message: 'Api key is null' });
		if (!userId)
			return res.json({ status: 'error', message: 'userId is null' });
		const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
		if (!apiKeyCheck)
			return res.json({ status: 'error', message: 'Api key is wrong' });

		// Build the filter object
		const filter = {};
		if (coin_id) filter.coin_id = coin_id;
		if (userId) filter.user_id = userId;
		if (status) filter.status = status;
		if (type) filter.type = type;
		if (dateFrom) filter.createdAt = { $gte: dateFrom };
		if (dateTo) filter.createdAt = { ...filter.createdAt, $lte: dateTo };
		const data = await WithdrawModel.find(filter).limit(recordPerPage).lean();
		if (!data.length) {
			return res.json({ status: 'error', message: 'Data not found!' });
		}
		// create a new PDF document
		const doc = new PDFDocument();

		// set the response headers
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=withdraw.pdf');

		// add headings and format the data
		doc.text('Transaction Details', {
			align: 'center',
			bold: true,
			fontSize: 20,
		});
		doc.moveDown();

		const transactionsWithUserData = await Promise.all(
			data.map(async (transaction) => {
				const userData = await User.findOne({ _id: transaction.user_id });
				let coinData = await CoinList.findOne({ _id: transaction.coin_id });
				let amountInUsd;
				let symbol;
				if (coinData.symbol !== 'Margin') {
					symbol = coinData.symbol;
					amountInUsd =
						coinData.symbol === 'USDT'
							? transaction.amount
							: (await cryptoConvert(coinData.symbol, 'USDT')) *
							  transaction.amount;
				}

				return { ...transaction, userData, amountInUsd, symbol };
			})
		);

		transactionsWithUserData.forEach((transaction) => {
			doc.text(`name: ${transaction.userData?.name}`);
			doc.text(`currency: ${transaction.amount} ${transaction.symbol}`);
			doc.text(`amount: ${transaction.amountInUsd} USD`);
			doc.text(`Address: ${transaction.address}`);
			doc.text(`TX ID: ${transaction.tx_id}`);
			doc.text(`Status: ${transaction.status}`);
			doc.moveDown();
		});

		// pipe the PDF to the response
		doc.pipe(res);

		// end the PDF
		doc.end();
	} catch (error) {
		console.log(error);
		return res.json({ status: 'error', message: error.message });
	}
};
const filterWithdraw = async (req, res) => {
	const {
		apiKey,
		userId,
		recordPerPage,
		dateFrom,
		dateTo,
		status,
		type,
		coin_id,
	} = req.body;
	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	if (!userId) return res.json({ status: 'error', message: 'userId is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	// Build the filter object
	const filter = {};
	if (coin_id) filter.coin_id = coin_id;
	if (userId) filter.user_id = userId;
	if (status) filter.status = status;
	if (type) filter.type = type;
	if (dateFrom) filter.createdAt = { $gte: dateFrom };
	if (dateTo) filter.createdAt = { ...filter.createdAt, $lte: dateTo };

	const withdraws = await WithdrawModel.find({ filter })
		.limit(recordPerPage)
		.lean();
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
	let totalUsdWithdrawn = 0;
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
			totalUsdWithdrawn += parseFloat(data[i].availableBalance);
		} else {
			totalUsdWithdrawn += parseFloat(data[i].usdtValue);
		}
	}
	return res.json({ status: 'success', totalUsdWithdrawn });
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
	filterWithdraw,
	exportWithdrawData,
};
