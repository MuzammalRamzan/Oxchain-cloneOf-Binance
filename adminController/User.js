var authFile = require('../auth.js');
var UserModel = require('../models/User');

const BanUser = async (req, res) => {
	//burada banlanacak kullanıcı id'si alınacak

	var apiKey = req.body.apiKey;
	var userId = req.body.userId;

	if (apiKey == null || userId == null) {
		return res.json({
			status: 'error',
			message: 'Api key or user id is null',
		});
	}

	var apiKeyControl = await authFile.apiKeyChecker(apiKey);

	if (apiKeyControl == false) {
		return res.json({
			status: 'error',
			message: 'Api key is wrong',
		});
	}

	var user = await UserModel.findOne({ _id: userId });

	if (user == null) {
		return res.json({
			status: 'error',
			message: 'User not found',
		});
	}

	user.status = '5';

	await user.save();

	res.json({
		status: 'success',
		message: 'User banned',
	});
};

const ReBanUser = async (req, res) => {
	var apiKey = req.body.apiKey;
	var userId = req.body.userId;

	if (apiKey == null || userId == null) {
		return res.json({
			status: 'error',
			message: 'Api key or user id is null',
		});
	}

	var apiKeyControl = await authFile.apiKeyChecker(apiKey);

	if (apiKeyControl == false) {
		return res.json({
			status: 'error',
			message: 'Api key is wrong',
		});
	}

	var user = await UserModel.findOne({ _id: userId, status: '5' });

	if (user == null) {
		return res.json({
			status: 'error',
			message: 'User not found',
		});
	}

	user.status = '1';

	await user.save();

	res.json({
		status: 'success',
		message: 'User re-banned',
	});
};

const editUser = async (req, res) => {
	const apiKey = req.body.apiKey;
	const userId = req.body.userId;
	const twoFAPin = req.body.twoFAPin;
	const name = req.body.name;
	const surname = req.body.surname;
	const email = req.body.email;
	const countryCode = req.body.countryCode;
	const phoneNumber = req.body.phoneNumber;
	const city = req.body.city;
	const country = req.body.country;
	const address = req.body.address;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const data = {};
	if (name) data.name = name;
	if (email) data.email = email;
	if (twoFAPin) data.twofa = twoFAPin;
	if (surname) data.surname = surname;
	if (countryCode) data.country_code = countryCode;
	if (phoneNumber) data.phone_number = phoneNumber;
	if (city) data.city = city;
	if (country) data.country = country;
	if (address) data.address = address;

	await UserModel.updateOne({ _id: userId }, data);
	return res.json({ status: 'success', message: 'User updated' });
};

const getUser = async (req, res) => {
	const apiKey = req.body.apiKey;
	const userId = req.body.userId;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const user = await UserModel.findOne({ _id: userId }).lean();
	if (!user) return res.json({ status: 'error', message: 'user not found' });
	return res.json({ status: 'success', data: user });
};

const userList = async (req, res) => {
	const apiKey = req.body.apiKey;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const users = await UserModel.find().lean();
	return res.json({ status: 'success', data: users });
};

const denyApplicant = async (req, res) => {
	const apiKey = req.body.apiKey;
	const userId = req.body.userId;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });

	const user = await UserModel.findById(userId).lean();
	await resetApplicant(user.applicantId);
	await UserModel.updateOne({ _id: userId }, { applicantStatus: 0 });

	return res.json({ status: 'success', message: 'Applicant updated' });
};
const filterUser = async (req, res) => {
	const apiKey = req.body.apiKey;

	if (!apiKey) return res.json({ status: 'error', message: 'Api key is null' });
	const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
	if (!apiKeyCheck)
		return res.json({ status: 'error', message: 'Api key is wrong' });
	const { id, name, email } = req.query;
	const recordPerPage = req.query.recordPerPage || 10;
	const dateFrom = req.query.dateFrom;
	const dateTo = req.query.dateTo;

	// Build the filter object
	const filter = {};
	if (id) filter._id = id;
	if (name) filter.name = name;
	if (email) filter.email = email;
	if (dateFrom) filter.createdAt = { $gte: dateFrom };
	if (dateTo) filter.createdAt = { ...filter.createdAt, $lte: dateTo };

	// Execute the query
	UserModel.find(filter)
		.limit(recordPerPage)
		.then((users) => res.json({ status: 'success', data: users }))
		.catch((err) => res.status(500).json({ error: err.message }));
};
module.exports = {
	BanUser,
	ReBanUser,
	editUser,
	getUser,
	userList,
	denyApplicant,
	filterUser,
};
