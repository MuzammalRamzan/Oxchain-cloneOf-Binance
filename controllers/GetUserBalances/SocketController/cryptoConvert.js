const axios = require('axios');
require('dotenv').config();
const developmentURL = 'https://api.binance.com/api/v3/ticker/price?symbol=';
const productionURL = 'http://18.130.193.166:8542/price?symbol=';
const cryptoConvert = async (firstCoinSymbol, secondCoinSymbol) => {
	// Replace the symbol 'SHIBA' with 'SHIB'
	if (firstCoinSymbol == 'SHIBA') {
		firstCoinSymbol = 'SHIB';
	}
	if (secondCoinSymbol == 'SHIBA') {
		secondCoinSymbol = 'SHIB';
	}
	if (process.env.NODE_ENV === 'development') {
		// Make a call to the Binance API to get the current price of the coin
		let findBinanceItem = await axios(
			developmentURL + firstCoinSymbol + secondCoinSymbol
		);
		console.log(findBinanceItem.data.price);
		return findBinanceItem.data.price;
	} else {
		let findBinanceItem = await axios(
			productionURL + firstCoinSymbol + secondCoinSymbol
		);
		return findBinanceItem.data.data.ask;
	}
};
module.exports = cryptoConvert;
