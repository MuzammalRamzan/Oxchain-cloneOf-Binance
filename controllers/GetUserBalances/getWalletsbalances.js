const SpotFunds = require('./SocketController/spot_funds');
const FutureAssets = require('./SocketController/futuer_funds');
const marginCrossFunds = require('./SocketController/margin_cross');
const marginIsolatedFunds = require('./SocketController/margin_isolated');
const cryptoConvert = require('./SocketController/cryptoConvert');
const calculatePercentage = (totalvalue, value) => {
	return (value / totalvalue) * 100;
};
var authFile = require('../../auth.js');

const getWalletsBalance = async (req, res) => {
	// Check if the request is authenticated
	const apiKey = req.body.api_key;
	const userId = req.body.userId;
	const isAuthenticated = await authFile.apiKeyChecker(apiKey);
	if (!isAuthenticated) {
		return res.status(403).json({
			status: 'fail',
			message: '403 Forbidden',
			showableMessage: 'Forbidden 403, Please provide valid api key',
		});
	}

	// Initialize variables to store balance data
	let totalUsd = 0;
	// Initialize array to store balances data
	let data = [];

	// Get balance data for each account type
	const spotAccountFunds = await SpotFunds(userId);
	const futureAccountFunds = await FutureAssets(userId);
	const crossMarginAccountFunds = await marginCrossFunds(userId);
	const isolatedMarginAccountFunds = await marginIsolatedFunds(userId);

	// Calculate total USD balance for each account type
	const accountFunds = [
		spotAccountFunds,
		futureAccountFunds,
		crossMarginAccountFunds,
		isolatedMarginAccountFunds,
	];
	const accountTypes = [
		'totalUsdInSpotAccount',
		'totalUsdInFutureAccount',
		'totalUsdInCrossMarginAccount',
		'totalUsdInIsolatedMarginAccount',
	];
	let totalUsdInAccount = {
		totalUsdInSpotAccount: 0,
		totalUsdInFutureAccount: 0,
		totalUsdInCrossMarginAccount: 0,
		totalUsdInIsolatedMarginAccount: 0,
	};
	let percentageWalletTypes = [
		'spotAccountPercentage',
		'futureAccountPercentage',
		'crossMarginAccountPercentage',
		'isolatedMarginAccountPercentage',
	];
	let percentages = {
		spotAccountPercentage: 0,
		futureAccountPercentage: 0,
		crossMarginAccountPercentage: 0,
		isolatedMarginAccountPercentage: 0,
	};
	let walletTypes = [
		'Fiat and Spot',
		'USD(S)-M Futures',
		'Margin Cross',
		'Margin Isolated',
	];
	let accountData = [];

	for (let i = 0; i < accountFunds.length; i++) {
		accountFunds[i].forEach((fund) => {
			// If the symbol is USDT, add the total balance to the total USD balance for this account
			if (fund.symbol === 'USDT') {
				totalUsdInAccount[accountTypes[i]] += fund.totalBalance;
				totalUsd += fund.totalBalance;
			} else if (fund.symbol !== 'Margin') {
				// Otherwise, if the symbol is not 'Margin', add the USDT value of the balance to the total USD balance for this account
				totalUsdInAccount[accountTypes[i]] += fund.usdtValue;
				totalUsd += fund.usdtValue;
			}
		});
	}
	for (let i = 0; i < walletTypes.length; i++) {
		percentages[percentageWalletTypes[i]] = calculatePercentage(
			totalUsd,
			totalUsdInAccount[accountTypes[i]]
		);
		accountData.push({
			name: walletTypes[i],
			UsdBalance: totalUsdInAccount[accountTypes[i]],
			percent: percentages[percentageWalletTypes[i]],
		});
	}

	data.push({
		totalBalanceInUSDT: totalUsd,
		balances: accountData,
	});

	res.status(200).json({
		status: true,
		data,
	});
};
module.exports = getWalletsBalance;
