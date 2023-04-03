const UserRef = require('../../models/UserRef');
const Referral = require('../../models/Referral');
const Deposits = require('../../models/Deposits');
const User = require('../../models/User');
const authFile = require('../../auth');
const getReferralHistory = async (req, res) => {
	try {
		const { api_key, user_id, status, startDate, endDate } = req.body;
		let referrals = [];
		let data = [];

		const isAuthenticated = await authFile.apiKeyChecker(api_key);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		let key = req.headers['key'];

		if (!key) {
			return res.json({ status: 'fail', message: 'key_not_found' });
		}

		if (!req.body.device_id || !req.body.user_id) {
			return res.json({
				status: 'fail',
				message: 'invalid_params (key, user id, device_id)',
			});
		}

		let checkKey = await authFile.verifyKey(
			key,
			req.body.device_id,
			req.body.user_id
		);

		if (checkKey === 'expired') {
			return res.json({ status: 'fail', message: 'key_expired' });
		}

		if (!checkKey) {
			return res.json({ status: 'fail', message: 'invalid_key' });
		}
		const userRef = await UserRef.findOne({ user_id });
		// Get the level 1 referrals
		referrals = await Referral.find({ reffer: userRef.refCode });

		// Apply filters if provided
		if (status === 'completed') {
			// Filter the referrals array to only include referrals with a deposit
			const referralIdsWithDeposit = await Deposits.distinct('user_id', {
				user_id: { $in: referrals.map((referral) => referral.user_id) },
			});
			referrals = referrals.filter((referral) =>
				referralIdsWithDeposit.includes(referral.user_id)
			);
		} else if (status === 'pending') {
			// Filter the referrals array to only include referrals without a deposit
			const referralIdsWithDeposit = await Deposits.distinct('user_id', {
				user_id: { $in: referrals.map((referral) => referral.user_id) },
			});
			referrals = referrals.filter(
				(referral) => !referralIdsWithDeposit.includes(referral.user_id)
			);
		}

		// Apply date filter if provided
		if (startDate || endDate) {
			const dateFilter = {};
			if (startDate) {
				dateFilter.$gte = new Date(startDate);
			}
			if (endDate) {
				dateFilter.$lte = new Date(endDate);
			}
			referrals = await Referral.find({
				reffer: userRef.refCode,
				createdAt: dateFilter,
			});
		}

		// Loop through the filtered referrals array and add deposit information to each referral
		for (const referral of referrals) {
			const deposit = await Deposits.findOne({ user_id: referral.user_id });
			const hasDeposit = deposit ? 'completed' : 'pending';
			const user = await User.findOne({ _id: referral.user_id });
			// if (user) {
			const referralData = {
				showableUserId: user?.showableUserId,
				register_date: user?.createdAt,
				has_deposit: hasDeposit,
			};
			data.push(referralData);
			// }
		}

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

module.exports = getReferralHistory;
