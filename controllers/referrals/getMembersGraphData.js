const UserRef = require('../../models/UserRef');
const Referral = require('../../models/Referral');
const authFile = require('../../auth');
const IBModel = require('../../models/IBModel');

const getMembersGraphData = async (req, res) => {
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
		const userRef = await UserRef.findOne({ user_id });
		const referrals = await Referral.find({ reffer: userRef.refCode });
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

module.exports = getMembersGraphData;
