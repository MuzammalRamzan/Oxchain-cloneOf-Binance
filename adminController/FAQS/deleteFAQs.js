const Faqs = require('../../models/FAQs');
const authFile = require('../../auth');
const deleteFAQs = async (req, res) => {
	try {
		const { apiKey } = req.body;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		// Find the FAQ by id
		const faq = await Faqs.findById(req.params.id);

		if (!faq) {
			return res.status(404).json({
				status: 'fail',
				message: 'not found',
				showableMessage: 'FAQ not found',
			});
		}

		// Delete the FAQ
		await faq.remove();

		// Return success message
		return res.status(201).json({
			status: 'success',
			message: 'success',
			showableMessage: 'FAQ deleted successfully',
		});
	} catch (err) {
		// Log the error for debugging purposes
		console.error(err);
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = deleteFAQs;
