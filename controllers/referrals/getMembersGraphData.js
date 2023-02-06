const UserRef = require('../../models/UserRef');
const authFile = require('../../auth');
const getMembersGraphData = async (req, res) => {
	try {
		const apiKey = req.body.apiKey;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		const referrals = await UserRef.find();
		const totalMembers = await UserRef.countDocuments();
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
				totalMembers,
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

module.exports = getMembersGraphData;
