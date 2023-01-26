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
			return res.status(400).send({
				message:
					'News title, content, and author, file and fileExtension are required fields',
			});
		}
		if (!result.status) {
			console.log(result.error);
			return res.status(400).send({
				message: 'error while uploading photo!',
			});
		}
		// Create new news article
		const posts = new Posts({
			title: req.body.title,
			content: req.body.content,
			author: req.body.author,
			coverPhoto: result.data,
			category: req.body.category,
		});

		// Save news article to database
		await posts.save();
		return res.status(201).send({
			status: true,
			message: 'post is added successfully!',
		});
	} catch (error) {
		res.status(500).send({ status: false, error: error.message });
	}
};
module.exports = createPost;
