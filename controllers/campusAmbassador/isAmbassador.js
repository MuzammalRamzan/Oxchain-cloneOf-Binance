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
