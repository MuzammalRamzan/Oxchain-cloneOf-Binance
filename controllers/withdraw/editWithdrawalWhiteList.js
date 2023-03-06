const WithdrawalWhiteListModel = require('../../models/WithdrawalWhiteList');
const authFile = require('../../auth.js');
const User = require('../../models/User');

const editWithdrawalWhiteList = async (req, res) => {
	const api_key = req.body.api_key;
	const user_id = req.body.user_id;
	var twofapin = req.body.twofapin;

	var api_key_result = req.body.api_key;

	let result = await authFile.apiKeyChecker(api_key_result);

	if (result === true) {

		let checkWithdrawalWhiteList = await WithdrawalWhiteListModel.findOne({
			user_id: user_id
		});


		let checkUser = await User.findOne({
			_id: user_id
		});

		if (!checkUser) {

			return res.json({
				status: "fail",
				message: "User not found"
			});
		}


		let twofa = checkUser.twofa;

		if (twofa != undefined && twofa != null && twofa != "") {

			if (req.body.twofapin == undefined || req.body.twofapin == null || req.body.twofapin == "") {
				return res.json({ status: "fail", message: "verification_failed, send 'twofapin'", showableMessage: "Wrong 2FA Pin" });
			}

			let resultt = await authFile.verifyToken(req.body.twofapin, twofa);

			if (resultt === false) {
				return res.json({ status: "fail", message: "verification_failed", showableMessage: "Wrong 2FA Pin" });
			}
		}

		if (checkWithdrawalWhiteList) {

			if (checkWithdrawalWhiteList.status == 1) {
				checkWithdrawalWhiteList.status = 0;
			} else {
				checkWithdrawalWhiteList.status = 1;
			}

			await checkWithdrawalWhiteList.save();

			return res.json({
				status: "success",
				message: "Withdrawal WhiteList Status Changed"
			});


		}
		else {
			let newWithdrawalWhiteList = new WithdrawalWhiteListModel({
				user_id: user_id,
				status: 1
			});

			await newWithdrawalWhiteList.save();

			return res.json({
				status: "success",
				message: "Withdrawal WhiteList Status Changed"
			});

		}

	}



}


module.exports = editWithdrawalWhiteList;
