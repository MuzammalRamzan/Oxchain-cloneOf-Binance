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
		return res.status(201).json({
			status: 'sucess',
			message: 'Success',
			showableMessage: 'Support Member Added Successfully',
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
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
		if (!supportTeamMembers.length) {
			return res.status(404).json({
				status: 'fail',
				message: 'not found',
				showableMessage: 'No support Team member Found',
			});
		}
		return res.status(200).json({
			status: 'sucess',
			message: 'Support team member',
			data: supportTeamMembers,
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = { addSupportTeamMember, searchSupportTeamMember };
