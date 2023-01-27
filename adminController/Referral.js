const authFile = require('../auth.js');
const FeeModel = require('../models/FeeModel');
const UserRef = require('../models/UserRef.js');
const getReferralRewardByUserId = async (req, res) => {
	const apiKey = req.body.apiKey;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });

	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);

	if (!apiKeyCheck) {
		return res.json({ status: 'error', message: 'Api key is wrong' });
	}

	const fee = await FeeModel.find({ to_user_id: req.body.userId });

	if (!fee) {
		return res.json({ status: 'error', message: 'Fee not found' });
	} else {
		res.json({ status: 'success', data: fee });
	}
};
const getAllRefferals = async (req, res) => {
	const apiKey = req.body.apiKey;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });

	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);

	if (!apiKeyCheck) {
		return res.json({ status: 'error', message: 'Api key is wrong' });
	}
	const userRefs = await UserRef.find()
		.populate({ path: 'user_id', model: 'User' })
		.lean();

	res.json({ status: 'success', data: userRefs });
};

const getRefferralReward = async (req, res) => {
	const apiKey = req.body.apiKey;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });

	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);

	if (!apiKeyCheck) {
		return res.json({ status: 'error', message: 'Api key is wrong' });
	}

	const fee = await FeeModel.find({});

	if (!fee) {
		return res.json({ status: 'error', message: 'Fee not found' });
	} else {
		res.json({ status: 'success', data: fee });
	}
};

module.exports = {
	getReferralRewardByUserId,
	getRefferralReward,
	getAllRefferals,
};
