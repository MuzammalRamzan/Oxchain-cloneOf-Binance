const authFile = require('../../auth');
const IBModel = require('../../models/IBModel');
const isAmbassador = async (req, res) => {
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


		let key = req.headers["key"];

		if (!key) {
			return res.json({ status: "fail", message: "key_not_found" });
		}

		if (!req.body.device_id || !req.body.user_id) {
			return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
		}

		let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


		if (checkKey === "expired") {
			return res.json({ status: "fail", message: "key_expired" });
		}

		if (!checkKey) {
			return res.json({ status: "fail", message: "invalid_key" });
		}


		const ambassador = await IBModel.findOne({
			user_id,
		});
		if (ambassador) {
			return res.status(200).json({
				status: 'success',
				message: 'given user_id is  ambassador',
				data: true,
			});
		} else {
			return res.status(200).json({
				status: 'success',
				message: 'given user_id is not ambassador',
				data: false,
			});
		}
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = isAmbassador;
