const FAQ = require('../models/FAQs');

const createFAQMember = async (req, res) => {
	try {
		const { name, email, phone, status, apiKey } = req.body;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		const faqMember = new FAQ({
			name,
			email,
			phone,
			status,
		});
		await faqMember.save();
		res.status(201).json({
			status: 'success',
			message: 'FAQs member added successfully',
			showableMessage: 'FAQs member added successfully',
		});
	} catch (error) {
		res.status(500).json({
			status: false,
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
const getAllFAQMembers = async (req, res) => {
	try {
		const apiKey = req.body.apiKey;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		const faqMember = await FAQ.find();
		if (!faqMember.length) {
			return res.status(404).json({
				status: false,
				message: 'Not found',
				showableMessage: 'No agents found',
			});
		}
		res
			.status(200)
			.json({ status: true, message: 'FAQ members', data: faqMember });
	} catch (error) {
		res.status(500).json({
			status: false,
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = {
	createFAQMember,
	getAllFAQMembers,
};
