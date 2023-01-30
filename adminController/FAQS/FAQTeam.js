const FAQMember = require('../../models/FAQSMember');
const authFile = require('../../auth');

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
		const faqMember = new FAQMember({
			name,
			email,
			phone,
			status,
		});
		await faqMember.save();
		return res.status(201).json({
			status: 'success',
			message: 'success',
			showableMessage: 'FAQs member added successfully',
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
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
		const faqMember = await FAQMember.find();
		if (!faqMember.length) {
			return res.status(404).json({
				status: 'fail',
				message: 'not found',
				showableMessage: 'FAQ not found',
			});
		}
		return res.status(201).json({
			status: 'success',
			message: 'success',
			data: faqMember,
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = {
	createFAQMember,
	getAllFAQMembers,
};
