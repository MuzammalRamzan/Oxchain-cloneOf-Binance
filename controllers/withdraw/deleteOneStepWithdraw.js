const authFile = require('../../auth');
const OneStepWithdrawModel = require('../../models/OneStepWithdraw');
const UserModel = require('../../models/User');

const deleteOneStepWithdraw = async (req, res) => {
	const apiKey = req.body.api_key;
	const userId = req.body.user_id;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });

	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

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

	let oneStepChecker = await OneStepWithdrawModel.findOne({
		user_id: userId,
	});

	if (!oneStepChecker) {
		return res.json({
			status: 'fail',
			message: 'One step Withdrawl not found',
			showableMessage: 'One step Withdrawl not found',
		});
	} else {
		await OneStepWithdrawModel.deleteOne({ user_id: userId });
		return res.json({
			status: 'success',
			message: 'One-step Withdrawal disabled Successfully!',
		});
	}
};

module.exports = deleteOneStepWithdraw;
