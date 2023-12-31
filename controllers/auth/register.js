const User = require('../../models/User');
const Referral = require('../../models/Referral');
const RegisterMail = require('../../models/RegisterMail');
const RegisterSMS = require('../../models/RegisterSMS');
const UserRef = require('../../models/UserRef');
const utilities = require('../../utilities');
const { PhoneNumberUtil } = require('google-libphonenumber');
const {
	generateFromEmail,
	generateUsername,
} = require('unique-username-generator');

const phoneNumberUtil = PhoneNumberUtil.getInstance();
const registerController = async (req, res) => {
	try {
		var registerType = req.body.registerType;
		var data = req.body.data;
		var pin = req.body.pin;

		var refStatus = 'false';
		var reffer = req.body.reffer;
		if (reffer) {
			refStatus = 'yes';
		} else {
			refStatus = 'no';
		}

		let newUser;

		let checkEmail = '';
		if (registerType == 'email') {
			if (
				!data ||
				data == undefined ||
				data == null ||
				data == '' ||
				!pin ||
				pin == undefined ||
				pin == null ||
				pin == ''
			) {
				return res.json({
					status: 'fail',
					message: 'email_pin_required',
					showableMessage: 'Email and Pin is required',
				});
			}
			let filter = {};
			filter.expiryTime = { $gt: Date.now() };
			filter.email = data;
			filter.pin = pin;
			filter.status = 0;
			checkEmail = await RegisterMail.findOne(filter).exec();

			if (checkEmail == null) {
				return res.json({
					status: 'fail',
					message: 'Pin_time_expired',
					showableMessage: 'Pin Time has been expired',
				});
			}
			filter.email = data;
			filter.pin = pin;
			filter.status = 0;
			checkEmail = await RegisterMail.findOne(filter).exec();

			if (checkEmail == null) {
				return res.json({
					status: 'fail',
					message: 'pin_not_found',
					showableMessage: 'Pin not found',
				});
			}

			//check email unique if deleted is not true

			let checkEmailUnique = await User.findOne({
				email: data,
				deleted: false,
			}).exec();

			if (checkEmailUnique) {
				return res.json({
					status: 'fail',
					message: 'email_already_registered',
					showableMessage: 'Email already registered',
				});
			}
			checkEmail.status = 1;
		}

		let checkPhone = '';
		if (registerType == 'phone') {
			if (
				!req.body.country_code ||
				req.body.country_code == undefined ||
				req.body.country_code == null ||
				req.body.country_code == '' ||
				!req.body.data ||
				req.body.data == undefined ||
				req.body.data == null ||
				req.body.data == '' ||
				!req.body.pin ||
				req.body.pin == undefined ||
				req.body.pin == null ||
				req.body.pin == ''
			) {
				return res.json({
					status: 'fail',
					message: 'phone and country code required',
					showableMessage: 'Phone and Country Code is required',
				});
			}
			if (!phoneNumberUtil.getMetadataForRegion(req.body.country_code)) {
				return res.json({
					status: 'fail',
					message: 'Inavlid country code',
					showableMessage: 'Entered country code is incorrect!',
				});
			}
			const phoneNumber = phoneNumberUtil.parse(
				req.body.data,
				req.body.country_code
			);
			if (!phoneNumberUtil.isValidNumber(phoneNumber)) {
				return res.json({
					status: 'fail',
					message: 'Inavlid Phone number',
					showableMessage: 'Entered Phone number is incorrect!',
				});
			}
			// checkPhone = await RegisterSMS.findOne({
			//   country_code: req.body.country_code,
			//   phone_number: req.body.data,
			//   pin: pin,
			//   status: 0,
			// }).exec();
			let filter = {};
			filter.expiryTime = { $gt: Date.now() };
			filter.country_code = req.body.country_code;
			filter.phone_number = data;
			filter.pin = pin;
			filter.status = 0;
			checkPhone = await RegisterSMS.findOne(filter).exec();
			if (checkPhone == null) {
				return res.json({
					status: 'fail',
					message: 'Pin_time_expired',
					showableMessage: 'Pin Time has been expired',
				});
			}
			filter.country_code = req.body.country_code;
			filter.phone_number = data;
			filter.pin = pin;
			filter.status = 0;
			checkPhone = await RegisterSMS.findOne(filter).exec();

			if (checkPhone == null) {
				return res.json({
					status: 'fail',
					message: 'pin_not_found',
					showableMessage: 'Pin not found',
				});
			}

			let checkPhoneUnique = await User.findOne({
				country_code: req.body.country_code,
				phone_number: req.body.data,
				deleted: false,
			}).exec();

			if (checkPhoneUnique) {
				return res.json({
					status: 'fail',
					message: 'phone_already_registered',
					showableMessage: 'Phone already registered',
				});
			}
			checkPhone.status = 1;
		}

		do {
			var showableUserIdData = Math.floor(10000000 + Math.random() * 90000000);
			var checkShowableUserId = await User.findOne({
				showableUserId: showableUserIdData,
			}).exec();
		} while (checkShowableUserId != null);

		if (registerType == 'email') {
			const username = generateFromEmail(data, 0);
			newUser = new User({
				nickname: username,
				email: data,
				password: utilities.hashData(req.body.password),
				api_key_result: req.body.api_key,
				showableUserId: showableUserIdData,
				status: 1,
			});
		} else {
			const username = generateUsername('', 0, 15);
			newUser = new User({
				nickname: username,
				country_code: req.body.country_code,
				phone_number: req.body.data,
				password: utilities.hashData(req.body.password),
				api_key_result: req.body.api_key,
				showableUserId: showableUserIdData,
				status: 1,
			});
		}

		let usr = await newUser.save();
		if (refStatus == 'yes') {
			let user = await UserRef.findOne({ refCode: reffer }).exec();

			if (user != null) {
				var newReferral = new Referral({
					user_id: usr._id,
					reffer: reffer,
				});
				newReferral.save();
			} else {
				return res.json({
					status: 'fail',
					message: 'referral_not_found',
					showableMessage: 'Referral not found',
				});
			}
		}
		var regUserId = usr._id;
		var refCode = utilities.makeId(10);
		const newRef = new UserRef({
			user_id: regUserId,
			refCode: refCode,
		});
		await newRef.save();

		if (registerType == 'email') {
			checkEmail.save();
		} else {
			checkPhone.save();
		}
		return res.json({ status: 'success', data: newRef });
	} catch (error) {
		return res.json({
			status: 'fail',
			message: error.message,
			showableMessage: error.message,
		});
	}
};

module.exports = registerController;
