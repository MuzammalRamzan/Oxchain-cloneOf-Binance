const Referral = require('../../models/Referral');
const UserRef = require('../../models/UserRef');
const authFile = require('../../auth');
const TradeVolume = require('../../models/TradeVolumeModel');
const FutureWalletModel = require('../../models/FutureWalletModel');
const IBModel = require('../../models/IBModel');
const mongoose = require('mongoose');
const getAllLevelReferrals = async (req, res) => {
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
		let referralsCount = [0, 0, 0, 0];
		let totalMembers = 0;
		let referralsIds = [[], [], [], []];
		let tradeVolume = [0, 0, 0, 0];
		let totalFutureTradeVolume = 0;
		let totalSpotTradeVolume = 0;

		// Get the user's referral code
		const userRef = await UserRef.findOne({ user_id });

		if (userRef) {
			// Get the level 1 referrals
			const level1ReferralIds = await Referral.find({
				reffer: userRef.refCode,
			}).distinct('user_id');
			referralsCount[0] = level1ReferralIds.length;
			referralsIds[0] = level1ReferralIds;

			// Get the level 2 referrals
			const level2ReferralIds = await UserRef.find({
				user_id: { $in: level1ReferralIds },
			}).distinct('refCode');
			const level2ReferralIdsWithDupes = await Referral.find({
				reffer: { $in: level2ReferralIds },
			}).distinct('user_id');
			const level2ReferralIdsSet = new Set(level2ReferralIdsWithDupes);
			const level2ReferralIdsArray = Array.from(level2ReferralIdsSet);
			referralsCount[1] = level2ReferralIdsArray.length;
			referralsIds[1] = level2ReferralIdsArray;

			// Get the level 3 referrals
			const level3ReferralIds = await UserRef.find({
				user_id: { $in: level2ReferralIdsArray },
			}).distinct('refCode');
			const level3ReferralIdsWithDupes = await Referral.find({
				reffer: { $in: level3ReferralIds },
			}).distinct('user_id');
			const level3ReferralIdsSet = new Set(level3ReferralIdsWithDupes);
			const level3ReferralIdsArray = Array.from(level3ReferralIdsSet);
			referralsCount[2] = level3ReferralIdsArray.length;
			referralsIds[2] = level3ReferralIdsArray;

			// Get the level 4 referrals
			const level4ReferralIds = await UserRef.find({
				user_id: { $in: level3ReferralIdsArray },
			}).distinct('refCode');
			console.log('level4ReferralIds', level4ReferralIds);
			const level4ReferralIdsWithDupes = await Referral.find({
				reffer: { $in: level4ReferralIds },
			}).distinct('user_id');
			console.log('level4ReferralIdsWithDupes', level4ReferralIdsWithDupes);
			const level4ReferralIdsSet = new Set(level4ReferralIdsWithDupes);
			const level4ReferralIdsArray = Array.from(level4ReferralIdsSet);
			referralsCount[3] = level4ReferralIdsArray.length;
			referralsIds[3] = level4ReferralIdsArray;
		}
		for (let i = 0; i < 4; i++) {
			totalMembers += referralsIds[i].length;
			const sum = await TradeVolume.aggregate([
				{
					$match: {
						user_id: {
							$in: referralsIds[i].map((id) => mongoose.Types.ObjectId(id)),
						},
					},
				},
				{
					$group: {
						_id: null,
						totalAmount: { $sum: '$totalUSDT' },
					},
				},
			]);
			const futureSum = await FutureWalletModel.aggregate([
				{
					$match: {
						user_id: {
							$in: referralsIds[i],
						},
					},
				},
				{
					$group: {
						_id: null,
						totalFutureVolume: { $sum: '$amount' },
					},
				},
			]);
			if (sum[0]) {
				tradeVolume[i] = sum[0].totalAmount;
				totalSpotTradeVolume += sum[0].totalAmount;
			}
			if (futureSum[0]) {
				tradeVolume[i] += futureSum[0].totalFutureVolume;
				totalFutureTradeVolume += futureSum[0].totalFutureVolume;
			}
		}

		res.json({
			status: 'success',
			message: 'Refferals Trading Data',
			data: {
				referralsCount,
				referralsIds,
				tradeVolume,
				totalSpotTradeVolume,
				totalFutureTradeVolume,
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
module.exports = getAllLevelReferrals;
