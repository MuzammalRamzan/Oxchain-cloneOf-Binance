const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth.js');

const referralRewards = async (req, res) => {
	const apiKey = req.body.api_key;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const referrals = await FeeModel.aggregate([
		{
			$group: {
				_id: '$to_user_id',
				reward: { $sum: '$amount' },
			},
		},
		{
			$lookup: {
				from: 'users',
				localField: '_id',
				foreignField: '_id',
				as: 'user',
				pipeline: [
					{ $project: { email: 1, name: 1, surname: 1, nickname: 1 } },
				],
			},
		},
		{ $sort: { reward: -1 } },
		{
			$limit: 5,
		},
	]);
	return res.json({ status: 'success', data: referrals });
};

module.exports = referralRewards;
