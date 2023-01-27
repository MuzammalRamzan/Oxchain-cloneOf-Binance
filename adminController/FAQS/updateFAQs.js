const Faqs = require('../../models/FAQs');
const authFile = require('../../auth');

const updateFAQs = async (req, res) => {
	try {
		// Destructure the request body
		const { question, answer, category, keywords, apiKey } = req.body;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		// Check if the FAQ with the given id exists
		const faq = await Faqs.findById(req.params.id);
		if (!faq) {
			return res.status(404).json({
				status: 'fail',
				message: 'not found',
				showableMessage: 'FAQ not found',
			});
		}

		// Update the FAQ's properties
		if (question) faq.question = question;
		if (answer) faq.answer = answer;
		if (category) faq.category = category;
		if (keywords) faq.keywords = keywords;
		// Save the updated FAQ to the database
		const updatedFaq = await faq.save();

		// Return success message and the updated FAQ
		return res.status(201).json({
			status: 'success',
			message: 'FAQ added Successfully',
			data: updatedFaq,
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

module.exports = updateFAQs;
