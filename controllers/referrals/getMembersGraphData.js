const UserRef = require('../../models/UserRef');
const Referral = require('../../models/Referral');
const authFile = require('../../auth');
const IBModel = require('../../models/IBModel');

const getMembersGraphData = async (req, res) => {
	try {
		const apiKey = req.body.api_key;
		const user_id = req.body.user_id;
		const isAmbassador = req.body.isAmbassador;
		let referrals = [];

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
		// Get the level 1 referrals
		const level1ReferralIds = await Referral.find({
			reffer: userRef.refCode,
		}).distinct('user_id');
		const level1Referrals = await Referral.find({
			reffer: userRef.refCode,
		});
		referrals = referrals.concat(level1Referrals);
		// Get the level 2 referrals
		const level2ReferralIds = await UserRef.find({
			user_id: { $in: level1ReferralIds },
		}).distinct('refCode');
		const level2Referrals = await Referral.find({
			reffer: { $in: level2ReferralIds },
		});
		const level2ReferralIdsWithDupes = await Referral.find({
			reffer: { $in: level2ReferralIds },
		}).distinct('user_id');
		const level2ReferralIdsSet = new Set(level2ReferralIdsWithDupes);
		const level2ReferralIdsArray = Array.from(level2ReferralIdsSet);
		referrals = referrals.concat(level2Referrals);
		// Get the level 3 referrals
		const level3ReferralIds = await UserRef.find({
			user_id: { $in: level2ReferralIdsArray },
		}).distinct('refCode');
		const level3Referrals = await Referral.find({
			reffer: { $in: level3ReferralIds },
		});
		const level3ReferralIdsWithDupes = await Referral.find({
			reffer: { $in: level3ReferralIds },
		}).distinct('user_id');
		const level3ReferralIdsSet = new Set(level3ReferralIdsWithDupes);
		const level3ReferralIdsArray = Array.from(level3ReferralIdsSet);
		referrals = referrals.concat(level3Referrals);
		const level4ReferralIds = await UserRef.find({
			user_id: { $in: level3ReferralIdsArray },
		}).distinct('refCode');
		const level4Referrals = await Referral.find({
			reffer: { $in: level4ReferralIds },
		});
		referrals = referrals.concat(level4Referrals);
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
