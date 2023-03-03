const Posts = require('../../models/Posts');
var authFile = require('../../auth.js');
const uploadImage = require('./uploadImage');
const createPost = async (req, res) => {
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
			!req.body.title ||
			!req.body.content ||
			!req.body.author ||
			!req.body.file ||
			!req.body.fileExtension
		) {
			return res.status(400).json({
				status: 'fail',
				message: 'Bad Request',
				showableMessage:
					'News title, content, and author, file and fileExtension are required fields',
			});
		}
		// Create new news article
		const posts = new Posts({
			title: req.body.title,
			content: req.body.content,
			author: req.body.author,
			coverPhoto: result,
			category: req.body.category,
		});

		// Save news article to database
		await posts.save();
		return res.status(200).json({
			status: 'success',
			message: 'Post_added',
			showableMessage: 'post is added successfully!',
		});
	} catch (error) {
		return res.status(500).json({
			status: 'success',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};
module.exports = createPost;
