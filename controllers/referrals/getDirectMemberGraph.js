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

		let key = req.headers["key"];

		if (!key) {
			return res.json({ status: "fail", message: "key_not_found" });
		}

		if (!req.body.device_id || !req.body.user_id) {
			return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
		}

		let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


		if (checkKey === "expired") {
			return res.json({ status: "fail", message: "key_expired" });
		}

		if (!checkKey) {
			return res.json({ status: "fail", message: "invalid_key" });
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
