const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth');

const getEarningsGraphData = async (req, res) => {
	try {
		const apiKey = req.body.api_key;
		const user_id = req.body.user_id;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		const fees = await FeeModel.find({ userId: user_id });
		const earnings = {};
		fees.forEach((fee) => {
			const date = fee.createdAt;
			if (!earnings[date]) {
				earnings[date] = 0;
			}
			earnings[date] += fee.amount;
		});
		const data = Object.entries(earnings).map(([date, earning]) => ({
			date: date,
			earning: earning,
		}));
		res.json({
			status: 'success',
			message: 'Refferal Graph Earning Data',
			data,
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
module.exports = getEarningsGraphData;
