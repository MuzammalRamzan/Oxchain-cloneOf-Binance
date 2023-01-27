const Posts = require('../../models/Posts');
var authFile = require('../../auth.js');

const searchPost = async (req, res) => {
	const { searchQuery, category, apiKey } = req.body;
	const isAuthenticated = await authFile.apiKeyChecker(apiKey);
	if (!isAuthenticated) {
		return res.status(403).json({
			status: 'fail',
			message: '403 Forbidden',
			showableMessage: 'Forbidden 403, Please provide valid api key',
		});
	}

	let query = {};
	if (searchQuery) {
		query.$text = { $search: searchQuery };
	}
	if (category) {
		query.category = category;
	}

	Posts.find(query, (error, articles) => {
		if (error) {
			res.status(500).send({ status: false, error: error.message });
		} else {
			res.send(articles);
		}
	});
};

module.exports = searchPost;
