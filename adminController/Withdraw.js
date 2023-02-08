const WithdrawModel = require('../models/Withdraw');
const authFile = require('../auth.js');
const User = require('../models/User');
const CoinList = require('../models/CoinList');
const { withdrawFund } = require('./withdrawFund');
const withdrawReport = require('./withdrawFundReport');
const cryptoConvert = require('../controllers/GetUserBalances/SocketController/cryptoConvert');
const PDFDocument = require('pdfkit');
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
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

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
			return res.status(404).json({
				status: 'fail',
				message: 'not found',
				showableMessage: 'Data not found!',
			});
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
		return res.status(501).json({
			status: 'error',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
const getUserWithdraw = async (req, res) => {
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
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

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
		return res.status(200).json({
			status: 'sucess',
			message: 'User Withdraws',
			data: withdraws,
		});
	} catch (error) {
		return res.status(501).json({
			status: 'error',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
const listWithdraws = async (req, res) => {
	try {
		const apiKey = req.body.apiKey;

		if (!apiKey)
			return res.json({ status: 'error', message: 'Api key is null' });
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		const withdraws = await WithdrawModel.find({}).lean();

		for (let i = 0; i < withdraws.length; i++) {
			let userData = await User.findOne({ _id: withdraws[i].user_id });
			withdraws[i].user = userData;

			let coinData = await CoinList.findOne({ _id: withdraws[i].coin_id });
			withdraws[i].coin = coinData;
		}
		return res.status(200).json({
			status: 'sucess',
			message: 'Users Withdraws',
			data: withdraws,
		});
	} catch (error) {
		return res.status(501).json({
			status: 'error',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
const totalWithdrawn = async (req, res) => {
	try {
		const status = req.body.status;
		const apiKey = req.body.apiKey;
		let totalUsdWithdrawn = 0;
		if (!status) {
			return res.status(400).send({
				message: 'status is required',
			});
		}
		if (!apiKey)
			return res.json({ status: 'error', message: 'Api key is null' });
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
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
		return res.status(200).json({
			status: 'sucess',
			message: 'Total USD Withdrawn',
			data: totalUsdWithdrawn,
		});
	} catch (error) {
		return res.status(501).json({
			status: 'error',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
const totalWithdrawGraphData = async (req, res) => {
	try {
		const apiKey = req.body.apiKey;
		let graphData = [];
		if (!apiKey)
			return res.json({ status: 'error', message: 'Api key is null' });
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
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
		return res.status(200).json({
			status: 'sucess',
			message: 'Withdrawn data',
			data: graphData,
		});
	} catch (error) {
		return res.status(501).json({
			status: 'error',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
module.exports = {
	listWithdraws,
	totalWithdrawn,
	totalWithdrawGraphData,
	getUserWithdraw,
	exportWithdrawData,
};
