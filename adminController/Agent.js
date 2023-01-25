const Agent = require('../models/Agent');

const createAgent = async (req, res) => {
	try {
		const { name, email, phone, status } = req.body;
		const agent = new Agent({
			name,
			email,
			phone,
			status,
		});
		await agent.save();
		res.status(201).json({ status: true, message: 'Agent added successfully' });
	} catch (error) {
		res.status(500).json({ status: false, message: error.message });
	}
};
const getAllAgents = async (req, res) => {
	try {
		const agents = await Agent.find();
		if (!agents || agents.length === 0) {
			return res
				.status(404)
				.json({ status: false, message: 'No agents found' });
		}
		res.status(200).json({ status: true, result: agents });
	} catch (error) {
		res.status(500).json({ status: false, message: error.message });
	}
};

module.exports = {
	createAgent,
	getAllAgents,
};
