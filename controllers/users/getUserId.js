const User = require('../../models/User');
var authFile = require('../../auth.js');

const getUserId = async function (req, res) {
	var email = req.body.email;
	var api_key_result = req.body.api_key;
	let country_code = req.body.country_code;
	let phone_number = req.body.phone_number;

	authFile.apiKeyChecker(api_key_result).then((result) => {
		if (result === true) {
			if (
				(email == null && phone_number == null) ||
				(email == '' && phone_number == '') ||
				(email == ' ' && phone_number == ' ')
			) {
				return res.json({
					status: 'fail',
					message: 'email_and_phone_number_are_null',
					showableMessage: 'Email and Phone Number are Null',
				});
			}
			//if email is not null
			if (email != null) {
				User.findOne({
					email: email,
				})
					.then((user) => {
						if (user != null) {
							console.log("user['twofa']", user['twofa']);
							let phone = '';
							let email = '';
							let twofa = '';
							if (
								user['phone_number'] != null &&
								user['phone_number'] != '' &&
								user['phone_number'] != ' '
							) {
								phone = 'enabled';
							}

							if (
								user['email'] != null &&
								user['email'] != '' &&
								user['email'] != ' '
							) {
								email = 'enabled';
							}
							if (
								user['twofa'] != null &&
								user['twofa'] != '' &&
								user['twofa'] != ' '
							) {
								twofa = 'enabled';
							}
							var myArray = [];
							myArray.push({
								response: 'success',
								user_id: user['id'],
								email: email,
								phone: phone,
								twofa: twofa,
							});
							return res.json({ status: 'success', data: myArray });
						} else {
							return res.json({
								status: 'fail',
								message: 'user_not_found',
								showableMessage: 'User not Found',
							});
						}
					})
					.catch((err) => {
						res.json({ status: 'fail', message: err });
					});

				return;
			} else {
				if (phone_number != null) {
					if (country_code == null) {
						return res.json({
							status: 'fail',
							message: 'country_code_is_null',
							showableMessage: 'Country Code is Null',
						});
					}

					User.findOne({
						country_code: country_code,
						phone_number: phone_number,
					})
						.then((user) => {
							if (user != null) {
								let phone = '';
								let email = '';
								let twofa = '';
								if (
									user['phone_number'] != null &&
									user['phone_number'] != '' &&
									user['phone_number'] != ' '
								) {
									phone = 'enabled';
								}

								if (
									user['email'] != null &&
									user['email'] != '' &&
									user['email'] != ' '
								) {
									email = 'enabled';
								}
								if (
									user['twofa'] != null &&
									user['twofa'] != '' &&
									user['twofa'] != ' '
								) {
									twofa = 'enabled';
								}

								var myArray = [];
								myArray.push({
									response: 'success',
									user_id: user['id'],
									email: email,
									phone: phone,
									twofa: twofa,
								});
								return res.json({ status: 'success', data: myArray });
							} else {
								return res.json({
									status: 'fail',
									message: 'user_not_found',
									showableMessage: 'User not Found',
								});
							}
						})
						.catch((err) => {
							return res.json({ status: 'fail', message: err });
						});
				}
			}
		} else {
			return res.json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: '403 Forbidden',
			});
		}
	});
};

module.exports = getUserId;
