const CoinList = require('../../../models/CoinList');
const Wallet = require('../../../models/Wallet');
const FutureOrderModel = require('../../../models/FutureOrder');
const axios = require('axios');

const SpotFunds = async (ws, user_id) => {
	let CoinListFind = await CoinList.find({});

	let prices = [];
	for (var i = 0; i < CoinListFind.length; i++) {
		let coinInfo = CoinListFind[i];
		if (coinInfo.symbol == 'USDT') continue;
		if (coinInfo.symbol == 'Margin') continue;
		if (coinInfo.symbol == 'SHIBA') {
			coinInfo.symbol = 'SHIB';
		}
		let findBinanceItem = await axios(
			'https://api.binance.com/api/v3/ticker/price?symbol=' +
			coinInfo.symbol +
			'USDT'
		);

		//create= a price object
		prices[coinInfo.symbol] = findBinanceItem.data.price;
	}

	let assets = await calculate(user_id, prices);
	ws.send(JSON.stringify({ page: 'spot', type: 'funds', content: assets }));
	FutureOrderModel.watch([
		{
			$match: {
				operationType: { $in: ['insert', 'update', 'remove', 'delete'] },
			},
		},
	]).on('change', async (data) => {
		let assets = await calculate(user_id, prices);
		ws.send(JSON.stringify({ page: 'spot', type: 'funds', content: assets }));
	});
};

async function calculate(user_id, prices) {
	let assets = [];

	let CoinListFind = await CoinList.find({});

	for (var i = 0; i < CoinListFind.length; i++) {
		let coinInfo = CoinListFind[i];
		let FutureOrders = await FutureOrderModel.findOne({
			user_id: user_id.toString(),
			method: 'market',
			status: 0,
			pair_name: coinInfo.symbol + '/USDT',
		});

		let amountData = 0;
		let pnl = 0;
		if (FutureOrders != null) {
			amountData = FutureOrders.amount;
			pnl = FutureOrders.pnl;
		}
		let btcPrice = 0;
		let usdtPrice = 0;

		if (coinInfo.symbol == 'BTC') {
			btcPrice = amountData;
			usdtPrice = amountData * prices['BTC'];
		} else {
			btcPrice = (amountData * prices[coinInfo.symbol]) / prices['BTC'];
			usdtPrice = amountData * prices[coinInfo.symbol];
		}

		assets.push({
			symbol: coinInfo.symbol,
			totalBalance: amountData,
			availableBalance: amountData,
			name: coinInfo.name,
			icon: coinInfo.image_url,
			inOrder: 0.0,
			pnl: pnl,
			availableBalance: 0.0,
			positionMargin: 0.0,
			OrderMargin: 0.0,
			Bonus: 0.0,
			BtcPrice: btcPrice,
			UsdtPrice: usdtPrice,
		});
	}
	return assets;
}
module.exports = SpotFunds;
