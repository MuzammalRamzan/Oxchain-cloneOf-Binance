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
	const emailPin = req.body.emailPin;
	const phonePin = req.body.phonePin;
	let reason = 'addRegisteredAddress';

	let result = await authFile.apiKeyChecker(api_key);

	if (result === true) {
		let user = await User.findOne({ _id: user_id });

		if (user) {


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


			var email = user['email'];
			var phone = user['phone_number'];
			var twofa = user['twofa'];
			let check1 = '';
			let check3 = '';

			if (email != undefined && email != null && email != '') {
				check1 = await MailVerification.findOne({
					user_id: user_id,
					reason: reason,
					pin: req.body.mailPin,
					status: 0,
				}).exec();
				if (!check1)
					return res.json({
						status: 'fail',
						message: 'verification_failed',
						showableMessage: 'Wrong Mail Pin',
					});
			}

			if (phone != undefined && phone != null && phone != '') {
				check3 = await SMSVerification.findOne({
					user_id: user_id,
					reason: reason,
					pin: req.body.smsPin,
					status: 0,
				}).exec();

				if (!check3)
					return res.json({
						status: 'fail',
						message: 'verification_failed',
						showableMessage: 'Wrong SMS Pin',
					});
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

			if (check1 != '') {
				check1.status = 1;
				await check1.save();
			}

			if (check3 != '') {
				check3.status = 1;
				await check3.save();
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
				return res.json({ status: 'success', message: saved });
			}
		}
		else {
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
