const DepositModel = require('../models/Deposits');
const CoinListModel = require('../models/CoinList');
const cryptoConvert = require('../controllers/GetUserBalances/SocketController/cryptoConvert');
const depositReport = async (status) => {
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

	let wallets = await DepositModel.find({});
	let assets = await calculate(wallets, prices);
	return assets;
};

async function calculate(wallets, prices) {
	let assets = [];
	for (var i = 0; i < wallets.length; i++) {
		let wallet = wallets[i];
		let coinInfo = await CoinListModel.findOne({ _id: wallet.coin_id });

		let btcPrice = 0;
		let usdtPrice = 0;

		let amountData = wallet.amount;

		if (coinInfo.symbol == 'BTC') {
			btcPrice = amountData;
			usdtPrice = amountData * prices['BTC'];
		} else {
			btcPrice = (amountData * prices[coinInfo.symbol]) / prices['BTC'];
			usdtPrice = amountData * prices[coinInfo.symbol];
		}

		assets.push({
			symbol: coinInfo.symbol,
			totalBalance: wallet.amount,
			availableBalance: wallet.amount,
			name: coinInfo.name,
			icon: coinInfo.image_url,
			inOrder: 0.0,
			btcValue: btcPrice,
			usdtValue: usdtPrice,
			date: wallet.createdAt,
		});
	}
	return assets;
}
module.exports = depositReport;
