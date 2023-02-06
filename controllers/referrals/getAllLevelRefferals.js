const Referral = require('../../models/Referral');
const UserRef = require('../../models/UserRef');
const TradeVolume = require('../../models/TradeVolumeModel');
const mongoose = require('mongoose');
const getAllLevelReferrals = async (req, res) => {
	let referralsCount = [0, 0, 0, 0];
	let referralsIds = [[], [], [], []];
	let tradeVolume = [0, 0, 0, 0];
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
		if (sum[0]) {
			tradeVolume[i] = sum[0].totalAmount;
		}
	}

	res.json({ referralsCount, tradeVolume });
};
module.exports = getAllLevelReferrals;
