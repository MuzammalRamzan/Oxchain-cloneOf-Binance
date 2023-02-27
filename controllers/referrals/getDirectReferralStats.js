const Referral = require('../../models/Referral');
const UserRef = require('../../models/UserRef');
const authFile = require('../../auth');
const TradeVolume = require('../../models/TradeVolumeModel');
const FutureWalletModel = require('../../models/FutureWalletModel');
const mongoose = require('mongoose');
const getDirectReferralStats = async (req, res) => {
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
		let referralsCount = 0;
		let referralsIds = [];
		let tradeVolume = 0;
		let totalFutureTradeVolume = 0;
		let totalSpotTradeVolume = 0;

		// Get the user's referral code
		const userRef = await UserRef.findOne({ user_id });

		if (userRef) {
			// Get Direct Referrals
			referralsIds = await Referral.find({
				reffer: userRef.refCode,
			}).distinct('user_id');
			referralsCount = referralsIds.length;
		}
		const sum = await TradeVolume.aggregate([
			{
				$match: {
					user_id: {
						$in: referralsIds.map((id) => mongoose.Types.ObjectId(id)),
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
						$in: referralsIds,
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
			tradeVolume = sum[0].totalAmount;
			totalSpotTradeVolume += sum[0].totalAmount;
		}
		if (futureSum[0]) {
			tradeVolume += futureSum[0].totalFutureVolume;
			totalFutureTradeVolume += futureSum[0].totalFutureVolume;
		}

		res.json({
			status: 'success',
			message: 'Direct Referral Trading Data',
			data: {
				referralsCount,
				referralsIds,
				tradeVolume,
				totalSpotTradeVolume,
				totalFutureTradeVolume,
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
module.exports = getDirectReferralStats;
