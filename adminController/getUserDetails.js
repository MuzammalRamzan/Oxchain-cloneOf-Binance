var authFile = require('../auth.js');
var UserModel = require('../models/User');
const DepositModel = require('../models/Deposits');

const getUsersDetails = async (req, res) => {
	//function to return totalRegistereduser, usersWithDeposits,UsersWithoutDeposits

	var apiKey = req.body.apiKey;

	var apiKeyControl = await authFile.apiKeyChecker(apiKey);

	if (apiKeyControl == false) {
		return res.json({
			status: 'error',
			message: 'Api key is wrong',
		});
	}

	// var user = await UserModel.findOne({ _id: userId });
	const registeredUsers = await UserModel.count({ status: 1 });
	const userWithDeposits = await (
		await DepositModel.distinct('user_id')
	).length;
	const usersWithoutDeposits = registeredUsers - userWithDeposits;

	res.json({
		status: 'success',
		registeredUsers,
		userWithDeposits,
		usersWithoutDeposits,
	});
};
module.exports = { getUsersDetails };
