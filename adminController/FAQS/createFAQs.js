const Faqs = require('../../models/FAQs');
const authFile = require('../../auth');

const createFAQs = async (req, res) => {
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

		// Validate the request body
		if (!question || !answer || !category) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Question, answer and category are required fields',
			});
		}

		// Create a new Faq instance
		const newFaq = new Faqs({
			question,
			answer,
			category,
			keywords,
		});

		// Save the new Faq to the database
		await newFaq.save();

		// Return success message and the saved Faq
		return res.status(201).json({
			status: 'success',
			message: 'success',
			showableMessage: 'FAQ added successfully',
		});
	} catch (error) {
		// Log the error for debugging purposes
		console.error('err');
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = createFAQs;
