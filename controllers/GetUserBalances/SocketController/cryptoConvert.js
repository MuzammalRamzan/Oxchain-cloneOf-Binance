const axios = require('axios');
const cryptoConvert = async (firstCoinSymbol, secondCoinSymbol) => {
	// Replace the symbol 'SHIBA' with 'SHIB'
	if (firstCoinSymbol == 'SHIBA') {
		firstCoinSymbol = 'SHIB';
	}
	if (secondCoinSymbol == 'SHIBA') {
		secondCoinSymbol = 'SHIB';
	}

	// Make a call to the Binance API to get the current price of the coin
	let findBinanceItem = await axios(
		'https://api.binance.com/api/v3/ticker/price?symbol=' +
			firstCoinSymbol +
			secondCoinSymbol
	);

	return findBinanceItem.data.price;
};
module.exports = cryptoConvert;
