const RegisterMail = require('../models/RegisterMail');
var authFile = require('../auth.js');
var mailer = require('../mailer.js');
let UserModel = require('../models/User');

const sendMailPin = async (req, res) => {
	var api_key_result = req.body.api_key;
	var email = req.body.email;
	let result = await authFile.apiKeyChecker(api_key_result);

	if (result === true) {
		if (!email || email == undefined || email == null || email == '') {
			return res.json({
				status: 'fail',
				message: 'email_required',
				showableMessage: 'Email is required',
			});
		}

		let userCheck = await UserModel.findOne({
			email: email,
		}).exec();

		if (userCheck) {
			return res.json({
				status: 'fail',
				message: 'email_already_registered',
				showableMessage: 'Email already registered',
			});
		}
		let check = await RegisterMail.findOne({
			email: email,
		}).exec();

		let pin = Math.floor(100000 + Math.random() * 900000);
		let expireTime = Date.now() + 5 * 60 * 1000;
		if (check) {
			check.pin = pin;
			check.status = 0;
			check.expiryTime = expireTime;
			check.save();
		}
		if (check == null) {
			const newPin = new RegisterMail({
				email: email,
				pin: pin,
				expiryTime: expireTime,
				status: 0,
			});
			newPin.save();
		}
		mailer.sendMail(email, 'Pin Code', 'Your pin code is ' + pin + '.');

		return res.json({
			status: 'success',
			message: 'pin_sent',
			showableMessage: 'Pin sent',
		});
	} else {
		return res.json({
			status: 'fail',
			message: 'Forbidden 403',
			showableMessage: 'Forbidden 403',
		});
	}
};

module.exports = sendMailPin;
