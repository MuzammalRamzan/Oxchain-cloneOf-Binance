const RankAwards = require('../../models/RankAwards');
var authFile = require('../../auth.js');
const uploadImage = require('./uploadImage');
const uploadRankAwardImages = async (req, res) => {
	try {
		//check if the request is authenticated
		const apiKey = req.body.api_key;
		const file = req.body.file;
		const fileExtension = req.body.fileExtension;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		const result = await uploadImage(file, fileExtension);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		// Validate request body
		if (
			!req.body.file ||
			!req.body.level
		) {
			return res.status(400).json({
				status: 'fail',
				message: 'Bad Request',
				showableMessage:
					'file & level are required fields',
			});
		}
		// Create new news rank award image 
		const rankAwards = new RankAwards({
			imageUrl: result,
			level: req.body.level,
		});

		// Save news rank awards to database
		await rankAwards.save();
		return res.status(200).json({
			status: 'success',
			message: 'Rank award image uploaded successfully!',
			showableMessage: 'Rank award image uploaded successfully!',
		});
	} catch (error) {
		return res.status(500).json({
			status: 'success',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
module.exports = uploadRankAwardImages;
