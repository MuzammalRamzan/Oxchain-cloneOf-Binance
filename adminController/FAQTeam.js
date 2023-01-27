const FAQ = require('../models/FAQs');

const createFAQMember = async (req, res) => {
	try {
		const { name, email, phone, status } = req.body;
		const faqMember = new FAQ({
			name,
			email,
			phone,
			status,
		});
		await faqMember.save();
		res
			.status(201)
			.json({ status: true, message: 'FAQs member added successfully' });
	} catch (error) {
		res.status(500).json({ status: false, message: error.message });
	}
};
const getAllFAQMembers = async (req, res) => {
	try {
		const faqMember = await FAQ.find();
		if (!faqMember.length) {
			return res
				.status(404)
				.json({ status: false, message: 'No agents found' });
		}
		res.status(200).json({ status: true, result: faqMember });
	} catch (error) {
		res.status(500).json({ status: false, message: error.message });
	}
};

module.exports = {
	createFAQMember,
	getAllFAQMembers,
};
