const SupportTeam = require('../../models/supportTeam');
const uploadSupportProfileImage = require('./uploadProfile');
var authFile = require('../../auth');
const addSupportTeamMember = async (req, res) => {
	try {
		const { image, extension, title, description, status, apiKey } = req.body;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		const result = await uploadSupportProfileImage(image, extension);
		// <-- added await keyword here
		const newSupportTeamMember = new SupportTeam({
			title,
			image: result,
			description,
			status,
		});
		await newSupportTeamMember.save();
		res.status(201).json({
			status: true,
			message: 'Support team member added successfully',
		});
	} catch (error) {
		res.status(500).json({ status: false, message: error.message });
	}
};
const searchSupportTeamMember = async (req, res) => {
	try {
		const {
			apiKey,
			title,
			description,
			dateFrom,
			dateTo,
			status,
			recordsPerpage,
		} = req.body;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		let filter = {};
		if (title) {
			filter.title = { $regex: title, $options: 'i' };
		}
		if (description) {
			filter.description = { $regex: description, $options: 'i' };
		}
		if (dateFrom && dateTo) {
			filter.createdAt = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
		}
		if (status) {
			filter.status = status;
		}
		const supportTeamMembers = await SupportTeam.find(filter).limit(
			recordsPerpage || 10
		);
		if (supportTeamMembers.length === 0) {
			return res.status(404).json({ message: 'No support team members found' });
		}
		res.status(200).json({ status: true, supportTeamMembers });
	} catch (error) {
		res.status(500).json({ status: false, message: error.message });
	}
};

module.exports = { addSupportTeamMember, searchSupportTeamMember };
