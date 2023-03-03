const User = require('../../models/User');
const RegisteredAddress = require('../../models/RegisteredAddress');
var authFile = require('../../auth.js');

const addNewRegisteredAddress = async function (req, res) {
	const api_key = req.body.api_key;
	const user_id = req.body.user_id;
	const address = req.body.address;
	const coin_id = req.body.coin_id;
	const type = req.body.type;
	const label = req.body.label;
	const origin = req.body.origin;
	const network = req.body.network;
	const whiteListed = req.body.whiteListed;
	const tag = req.body.tag;
	const email = req.body.emailPin;
	const phone = req.body.phonePin;
	let reason = 'addRegisteredAddress';

	let result = await authFile.apiKeyChecker(api_key);

	if (result === true) {
		let user = await User.findOne({ _id: user_id });

		if (user) {
			/******************************************************/
			let twofa = user.twofa;
			if (email != '' && email != undefined) {
				let mailVerification = await MailVerification.findOne({
					user_id: userId,
					reason: reason,
					pin: email,
					status: 0,
				});
				if (mailVerification) {
					await MailVerification.findOneAndUpdate(mailVerification._id, {
						user_id: userId,
						reason: reason,
						pin: email,
						status: 1,
					});
				} else {
					return res.json({
						status: 'failed',
						message: 'verification_failed',
						showableMessage: 'Mail pin is wrong',
					});
				}
			}

			if (phone != '' && phone != undefined) {
				let smsVerification = await SMSVerification.findOne({
					user_id: userId,
					reason: reason,
					pin: phone,
					status: 0,
				});

				if (smsVerification) {
					await SMSVerification.findOneAndUpdate(smsVerification._id, {
						user_id: userId,
						reason: reason,
						pin: phone,
						status: 1,
					});
				} else {
					return res.json({
						status: 'failed',
						message: 'verification_failed',
						showableMessage: 'Phone pin is wrong',
					});
				}
			}

			if (twofa != undefined && twofa != null && twofa != '') {
				if (
					req.body.twofapin == undefined ||
					req.body.twofapin == null ||
					req.body.twofapin == ''
				) {
					return res.json({
						status: 'fail',
						message: "verification_failed, send 'twofapin'",
						showableMessage: 'Wrong 2FA Pin',
					});
				}

				let resultt = await authFile.verifyToken(req.body.twofapin, twofa);

				if (resultt === false) {
					return res.json({
						status: 'fail',
						message: 'verification_failed',
						showableMessage: 'Wrong 2FA Pin',
					});
				}
			}
			/*****************************************/

			let checkAddress = await RegisteredAddress.findOne({
				user_id,
				address,
			});

			if (checkAddress) {
				res.json({
					status: 'fail',
					message: 'Address already exists',
					showableMessage: 'Address already exists',
				});
				return;
			}

			let newAddress = new RegisteredAddress({
				user_id,
				address,
				coin_id,
				tag,
				whiteListed,
				type,
				label,
				origin,
				network,
			});

			let saved = await newAddress.save();
			if (saved) {
				res.json({ status: 'success', message: saved });
			}
		} else {
			res.json({
				status: 'fail',
				message: 'Invalid user',
				showableMessage: 'Invalid user',
			});
		}
	} else {
		res.json({
			status: 'fail',
			message: 'invalid_api_key',
			showableMessage: 'Invalid api key',
		});
		return;
	}
};

module.exports = addNewRegisteredAddress;
