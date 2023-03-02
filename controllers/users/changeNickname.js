const User = require('../../models/User');
var authFile = require('../../auth.js');
const mailer = require('../../mailer');
const SiteNotifications = require('../../models/SiteNotifications');

const changeNickname = async function (req, res) {
	var user_id = req.body.user_id;
	var nickname = req.body.nickname;

	var api_key_result = req.body.api_key;

	var result = await authFile.apiKeyChecker(api_key_result);

	if (result === true) {
		// Validate nickname
		const regex = /^[a-zA-Z0-9]+$/;
		const MIN_LENGTH = 3;
		const MAX_LENGTH = 20;

		if (!nickname.match(regex)) {
			return res.json({
				status: 'fail',
				message: 'Nickname must only contain alphanumeric characters.',
				showableMessage: 'Nickname must only contain alphanumeric characters.',
			});
		} else if (nickname.length < MIN_LENGTH || nickname.length > MAX_LENGTH) {
			return res.json({
				status: 'fail',
				message: `Nickname must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`,
				showableMessage:
					'Nickname must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.',
			});
		}

		let user = await User.findOne({
			_id: user_id,
			status: 1,
		}).exec();

		if (user != null) {
			const filter = { _id: user_id, status: 1 };
			const update = { nickname: nickname };

			User.findOneAndUpdate(filter, update, (err, doc) => {
				if (err) {
					res.json({ status: 'fail', message: err });
				} else {
					let notificationCheck = SiteNotifications.findOne({
						user_id: user_id,
					}).exec();

					if (notificationCheck != null) {
						if (
							notificationCheck.system_messages == 1 ||
							notificationCheck.system_messages == '1'
						) {
							mailer.sendMail(
								user.email,
								'Nickname changed',
								'Nickname changed',
								'Your nickname has been changed. If you did not do this, please contact us immediately.'
							);
						}
					}

					return res.json({ status: 'success', data: 'update_success' });
				}
			});
		}
	}
};

module.exports = changeNickname;
