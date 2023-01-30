const Faqs = require('../../models/FAQs');
const authFile = require('../../auth');
const getAllFaqs = async (req, res) => {
	try {
		const apiKey = req.body.apiKey;
		if (apiKey == null) {
			return res.json({
				status: 'error',
				message: 'Api key is null',
			});
		}

		var apiKeyControl = await authFile.apiKeyChecker(apiKey);

		if (apiKeyControl == false) {
			return res.json({
				status: 'error',
				message: 'Api key is wrong',
			});
		}
		//get all faqs from db
		const faqs = await Faqs.find();
		// check if no faqs found
		if (!faqs) {
			return res.status(404).json({
				message: 'No FAQs found',
			});
		}

		//return all faqs
		return res.status(200).json({
			faqs: faqs,
		});
	} catch (err) {
		// Log the error for debugging purposes
		console.error(err);
		return res.status(500).json({
			message: 'Error fetching FAQs',
			error: err.message,
		});
	}
};
module.exports = getAllFaqs;
