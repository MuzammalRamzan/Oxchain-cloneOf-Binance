const IBModel = require('../../models/IBModel');
const Referral = require('../../models/Referral');
const SocialMediaPostModel = require('../../models/SocialMediaPostModel');
const TradeVolumeModel = require('../../models/TradeVolumeModel');
const User = require('../../models/User');
const UserRef = require('../../models/UserRef');

const CampusRequestJoin = async (req, res) => {
	try {
		let uid = req.body.user_id;
		let errors = [];

		let userInfo = await User.findOne({ _id: uid });
		let userRefCode = await UserRef.findOne({ user_id: uid });
		let subUsers = await Referral.find({ reffer: userRefCode.refCode });
		if (subUsers.length == 0) {
			errors.push('insufficient_reference');
		} else {
			subUsers = subUsers.map((u) => u.user_id);
			subUsers.push(uid);
		}

		if (userInfo.twitter_username == '') {
			errors.push('twitter_account_not_found');
		}

		if (userInfo.instagram_username == '') {
			errors.push('instagram_account_not_found');
		}
		if (userInfo.facebook_username == '') {
			errors.push('facebook_account_not_found');
		}

		let totalVolume = await totalTradeVolume(subUsers);

		if (totalVolume < 10000000) {
			errors.push('insufficient_trade_volume');
		}

		let postCount = await getSocialMediPostCount(uid);
		if (postCount < 5) {
			errors.push('insufficient_post');
		}

		if (errors.length > 0) {
			res.json({ status: 'fail', errors: errors });
			return;
		}

		let save = new IBModel({
			user_id: uid,
			status: 0,
		});
		await save.save();
		res.json({ status: 'success', data: save });
	} catch (err) {
		console.log(err);
		res.json({ status: 'fail', message: err.message });
	}
};

async function getSocialMediPostCount(user_id) {
	let date = new Date();
	let day = date.getDay();
	date = date.setDate(date.getDate() - 7);

	console.log(date);
	console.log({ user_id: user_id, created_at: { $lt: date } });
	let posts = await SocialMediaPostModel.find({
		user_id: user_id,
		created_at: { $lt: date },
	});
	return posts.length;
}

async function totalTradeVolume(users) {
	let volumes = await TradeVolumeModel.aggregate([
		{
			$group: {
				_id: '$user_id',
				totalUSDT: { $sum: '$totalUSDT' },
			},
		},
	]);
	let total = 0;

	for (var k = 0; k < volumes.length; k++) {
		if (users.indexOf(volumes[k]._id.toString()) != null) {
			total += parseFloat(volumes[k].totalUSDT);
		}
	}
	return total;
}

module.exports = CampusRequestJoin;
