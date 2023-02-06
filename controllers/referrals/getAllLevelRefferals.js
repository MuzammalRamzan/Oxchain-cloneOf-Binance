const Referral = require('../../models/Referral');
const UserRef = require('../../models/UserRef');
const authFile = require('../../auth');
const TradeVolume = require('../../models/TradeVolumeModel');
const FutureWalletModel = require('../../models/FutureWalletModel');
const mongoose = require('mongoose');
const getAllLevelReferrals = async (req, res) => {
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
		let referralsCount = [0, 0, 0, 0];
		let referralsIds = [[], [], [], []];
		let tradeVolume = [0, 0, 0, 0];
		let totalFutureTradeVolume = 0;
		let totalSpotTradeVolume = 0;
		const referrals = await Referral.find();
		for (const referral of referrals) {
			let currentRef = referral;
			for (let i = 0; i < 4; i++) {
				const referer = await UserRef.findOne({ refCode: currentRef.reffer });
				if (!referer) {
					break;
				}
				referralsCount[i]++;
				referralsIds[i].push(referer.user_id);
				currentRef = await Referral.findOne({ user_id: referer.user_id });
				if (!currentRef) {
					break;
				}
			}
		}
		for (let i = 0; i < 4; i++) {
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
module.exports = getAllLevelReferrals;
