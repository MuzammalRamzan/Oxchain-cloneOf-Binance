const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth');
const IBModel = require('../../models/IBModel');

const getEarningsGraphData = async (req, res) => {
	try {
		const apiKey = req.body.api_key;
		const user_id = req.body.user_id;
		const isAmbassador = req.body.isAmbassador;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		let key = req.headers["key"];

		if (!key) {
			return res.json({ status: "fail", message: "key_not_found" });
		}

		if (!req.body.device_id || !req.body.user_id) {
			return res.json({ status: "fail", message: "invalid_params" });
		}

		let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


		if (checkKey === "expired") {
			return res.json({ status: "fail", message: "key_expired" });
		}

		if (!checkKey) {
			return res.json({ status: "fail", message: "invalid_key" });
		}

		if (isAmbassador) {
			const ambassador = await IBModel.findOne({
				user_id,
			});
			if (!ambassador) {
				return res.status(404).json({
					status: 'fail',
					message: '404 not found',
					showableMessage: 'given user ID is not ambassador ID',
				});
			}
		}
		const fees = await FeeModel.find({ to_user_id: user_id });
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
