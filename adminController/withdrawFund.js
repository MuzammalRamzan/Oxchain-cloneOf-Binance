const WithdrawModel = require('../models/Withdraw');
const CoinListModel = require('../models/CoinList');
const cryptoConvert = require('../controllers/GetUserBalances/SocketController/cryptoConvert');
const withdrawFund = async (status) => {
	const withDrawList = await totalWithdrawn(status);
	const prices = await getPricesOfEachCoin();
	const assets = await calculate(withDrawList, prices);
	return assets;
};
const withdrawFundOfuser = async (userId) => {
	const depositList = await totalWithdrawanOfUser(userId);

	const prices = await getPricesOfEachCoin();
	const assets = await calculate(depositList, prices);
	return assets;
};
const getPricesOfEachCoin = async () => {
	let CoinListFind = await CoinListModel.find({});

	let prices = [];
	for (var i = 0; i < CoinListFind.length; i++) {
		let coinInfo = CoinListFind[i];
		if (coinInfo.symbol == 'USDT') continue;
		if (coinInfo.symbol == 'Margin') continue;
		if (coinInfo.symbol == 'SHIBA') {
			coinInfo.symbol = 'SHIB';
		}
		//create a price object
		prices[coinInfo.symbol] = await cryptoConvert(coinInfo.symbol, 'USDT');
	}
	return prices;
};
const totalWithdrawn = async (status) => {
	return WithdrawModel.aggregate(
		[
			{
				$match: { status },
			},
			{
				$project: {
					amount: { $convert: { input: '$amount', to: 'double' } },
					coin_id: 1,
				},
			},
			{
				$group: {
					_id: '$coin_id',
					totalAmount: { $sum: '$amount' },
				},
			},
		],
		function (err, result) {
			if (err) {
				// handle error
				return res.json({ status: 'success', err });
			} else {
				return result;
			}
		}
	);
};
const totalWithdrawanOfUser = async (userId) => {
	console.log('userId', userId);
	return WithdrawModel.aggregate(
		[
			{
				$match: { user_id: userId },
			},
			{
				$project: {
					amount: { $convert: { input: '$amount', to: 'double' } },
					coin_id: 1,
				},
			},
			{
				$group: {
					_id: '$coin_id',
					totalAmount: { $sum: '$amount' },
				},
			},
		],
		function (err, result) {
			if (err) {
				// handle error
				return res.json({ status: 'success', err });
			} else {
				return result;
			}
		}
	);
};
const calculate = async (wallets, prices) => {
	let assets = [];
	for (var i = 0; i < wallets.length; i++) {
		let wallet = wallets[i];
		let coinInfo = await CoinListModel.findOne({ _id: wallet._id });
		console.log('coinInfo', coinInfo);
		let btcPrice = 0;
		let usdtPrice = 0;

		let amountData = wallet.totalAmount;

		if (coinInfo.symbol == 'BTC') {
			btcPrice = amountData;
			usdtPrice = amountData * prices['BTC'];
		} else {
			btcPrice = (amountData * prices[coinInfo.symbol]) / prices['BTC'];
			usdtPrice = amountData * prices[coinInfo.symbol];
		}

		assets.push({
			symbol: coinInfo.symbol,
			totalBalance: wallet.totalAmount,
			availableBalance: wallet.totalAmount,
			name: coinInfo.name,
			icon: coinInfo.image_url,
			inOrder: 0.0,
			btcValue: btcPrice,
			usdtValue: usdtPrice,
		});
	}
	return assets;
};
module.exports = { withdrawFund, withdrawFundOfuser };
