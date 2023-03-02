const ReferralModel = require('../../models/Referral');
const authFile = require('../../auth.js');

const myReferrals = async (req, res) => {
	const apiKey = req.body.api_key;
	const refCode = req.body.refCode;
	const fromDate = req.body.fromDate;
	const toDate = req.body.toDate;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const query = { reffer: refCode };
	if (fromDate && toDate) query.createdAt = { $gte: fromDate, $lte: toDate };

	let referrals = await ReferralModel.find(query)
		.select({ user_id: 1, _id: 0 })
		.populate({
			path: 'user_id',
			model: 'User',
			select:
				'name surname nickname email status createdAt country_code phone_number showableUserId',
		})
		.lean();
	referrals = referrals.filter((referral) => referral.user_id !== null);

	return res.json({ status: 'success', data: referrals });
};

module.exports = myReferrals;
