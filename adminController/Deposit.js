const DepositModel = require('../models/Deposits');
const authFile = require('../auth.js');
const User = require('../models/User');
const { depositFund } = require('./depositFund');
const CoinList = require('../models/CoinList');
const depositReport = require('./depositReport');
const cryptoConvert = require('../controllers/GetUserBalances/SocketController/cryptoConvert');
const PDFDocument = require('pdfkit');
const userDeposits = async (req, res) => {
	const { apiKey, userId } = req.body;
	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	if (!userId) return res.json({ status: 'error', message: 'userId is null' });
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
const exportDepositsData = async (req, res) => {
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
	const data = await DepositModel.find(filter).limit(recordPerPage).lean();
	if (!data.length) {
		return res.json({ status: 'error', message: 'Data not found!' });
	}
	// create a new PDF document
	const doc = new PDFDocument();

	// set the response headers
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', 'attachment; filename=data.pdf');

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
};

const filterDeposits = async (req, res) => {
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
	const deposits = await DepositModel.find(filter).limit(recordPerPage).lean();

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
	filterDeposits,
	exportDepositsData,
};
