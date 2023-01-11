const CoinList = require('../../../models/CoinList');
const MarginCross = require('../../../models/MarginCrossWallet');
const axios = require('axios');
const cryptoConvert=require('./cryptoConvert.js')

const marginCrossFunds = async (user_id) => {
	let CoinListFind = await CoinList.find({});
	let prices = [];
	for (var i = 0; i < CoinListFind.length; i++) {
		let coinInfo = CoinListFind[i];
		if (coinInfo.symbol == 'USDT') continue;
		if (coinInfo.symbol == 'Margin') continue;
		if (coinInfo.symbol == 'SHIBA') {
			coinInfo.symbol = 'SHIB';
		}
	

		//create a price object
		prices[coinInfo.symbol] = await cryptoConvert(coinInfo.symbol,'USDT')
	}

	let wallets = await MarginCross.find({ user_id: user_id });
	let assets = await calculate(wallets, prices);
	return assets;
};

async function calculate(wallets, prices) {
	let assets = [];
	for (var i = 0; i < wallets.length; i++) {
		let wallet = wallets[i];
		let coinInfo = await CoinList.findOne({ _id: wallet.coin_id });
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
			totalBalance: wallet?.amount,
			name: coinInfo?.name,
			icon: coinInfo?.image_url,
			btcValue: typeof btcPrice == 'number' ? btcPrice : 0,
			usdtValue: typeof usdtPrice == 'number' ? usdtPrice : 0,
		});
	}
	return assets;
}
module.exports = marginCrossFunds;
