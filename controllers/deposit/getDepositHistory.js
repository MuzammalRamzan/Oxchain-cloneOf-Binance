const CoinList = require('../../models/CoinList');
const Deposits = require('../../models/Deposits');
const Network = require('../../models/Network');
var authFile = require('../../auth.js');

const GetDepositHistory = async (req, res) => {
	const { coin, status, firstDate, endDate, type } = req.body;
	let result = await authFile.apiKeyChecker(req.body.api_key);
	if (result === false) {
		return res.json({
			status: 'fail',
			message: '403 Forbidden',
			showableMessage: 'Forbidden 403',
		});
	}

	let key = req.headers['key'];

	if (!key) {
		return res.json({ status: 'fail', message: 'key_not_found' });
	}

	if (!req.body.device_id || !req.body.user_id) {
		return res.json({
			status: 'fail',
			message: 'invalid_params (key, user id, device_id)',
		});
	}

	let checkKey = await authFile.verifyKey(
		key,
		req.body.device_id,
		req.body.user_id
	);

	if (checkKey === 'expired') {
		return res.json({ status: 'fail', message: 'key_expired' });
	}

	if (!checkKey) {
		return res.json({ status: 'fail', message: 'invalid_key' });
	}

	let { user_id } = req.body;

	if (!user_id) {
		return res.json({
			status: 'fail',
			message: 'user_id is required',
		});
	}
	let coinInfo = await CoinList.findOne({
		symbol: coin,
	}).exec();
	let query = {};
	if (user_id) {
		query.user_id = user_id;
	}
	if (coinInfo) {
		query.coin_id = coinInfo._id;
	}
	if (status) {
		query.status = status;
	}
	if (type) {
		query.type = type;
	}
	if (firstDate && endDate) {
		query.createdAt = {
			$gte: firstDate,
			$lte: endDate,
		};
	}

	let deposits = await Deposits.find(query).exec();

	let depositsData = [];

	for (let i = 0; i < deposits.length; i++) {
		console.log(deposits[i].coin_id);

		let coinInfo = await CoinList.findOne({ _id: deposits[i].coin_id }).exec();

		let network = '';

		if (
			deposits[i].network_id != null &&
			deposits[i].network_id != undefined &&
			deposits[i].network_id != ''
		) {
			let networkInfo = await Network.findOne({
				_id: deposits[i].network_id,
			}).exec();
			network = networkInfo.symbol;
		}

		console.log(coinInfo);

		depositsData.push({
			id: deposits[i]._id,
			coin: {
				id: deposits[i].coin_id,
				name: coinInfo.symbol,
			},
			network: network,
			hash: deposits[i].tx_id,
			amount: deposits[i].amount,
			fromAddress: deposits[i].address,
			date: deposits[i].createdAt,
			status: deposits[i].status,
		});
	}
	return res.json({
		status: 'success',
		message: 'deposit history',
		data: depositsData,
	});
};
module.exports = GetDepositHistory;
