const News = require('../../models/News');
var authFile = require('../../auth.js');

const createNews = async (req, res) => {
	//check if the request is authenticated
	const apiKey = req.body.api_key;
	const isAuthenticated = await authFile.apiKeyChecker(apiKey);
	if (!isAuthenticated) {
		return res.status(403).json({
			status: 'fail',
			message: '403 Forbidden',
			showableMessage: 'Forbidden 403, Please provide valid api key',
		});
	}
	// Validate request body
	if (!req.body.title || !req.body.content || !req.body.author) {
		return res.status(400).send({
			message: 'News title, content, and author are required fields',
		});
	}

	// Create new news article
	const news = new News({
		title: req.body.title,
		content: req.body.content,
		author: req.body.author,
		coverPhoto: req.file.path,
	});

	// Save news article to database
	news.save((error) => {
		if (error) {
			res.status(500).send(error);
		} else {
			res.send(news);
		}
	});
};
module.exports = createNews;
