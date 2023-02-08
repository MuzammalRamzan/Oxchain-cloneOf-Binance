const Agent = require('../models/Agent');
const authFile = require('../auth');
const createAgent = async (req, res) => {
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
		const agentData = await Agent.find({ email });
		if (agentData.length) {
			return res.json({
				status: 'fail',
				message: 'Agent Already Registered',
				showableMessage: 'Agent Already Registered',
			});
		}
		const agent = new Agent({
			name,
			email,
			phone,
			status,
		});
		await agent.save();
		return res.status(201).json({
			status: 'sucess',
			message: 'Success',
			showableMessage: 'Agent Member Added Successfully',
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
const getAllAgents = async (req, res) => {
	try {
		const agents = await Agent.find();
		if (!agents || agents.length === 0) {
			return res.status(404).json({
				status: 'fail',
				message: 'not found',
				showableMessage: 'No Agent found',
			});
		}
		res.status(200).json({ status: true, result: agents });
		return res.status(201).json({
			status: 'sucess',
			message: 'Agent Members',
			ddata: agents,
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
	createAgent,
	getAllAgents,
};
