const UserRef = require('../../models/UserRef');
const Referral = require('../../models/Referral');
const authFile = require('../../auth');
const getDirectMemberGraph = async (req, res) => {
	try {
		const apiKey = req.body.api_key;
		const user_id = req.body.user_id;
		let referrals = [];

		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		const userRef = await UserRef.findOne({ user_id });
		// Get the level 1 referrals
		referrals = await Referral.find({
			reffer: userRef.refCode,
		});
		const referralCount = {};
		referrals.forEach((referral) => {
			const date = referral.createdAt.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
			if (!referralCount[date]) {
				referralCount[date] = 0;
			}
			referralCount[date] += 1;
		});
		const data = Object.entries(referralCount).map(([date, count]) => ({
			date,
			members: count,
		}));
		res.json({
			status: 'success',
			message: 'graph Data for members joining',
			data: {
				data,
			},
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = getDirectMemberGraph;
