const News = require('../../models/News');
const searchNews = (req, res) => {
	// Validate request query
	if (!req.query.query) {
		return res.status(400).send({
			message: 'Search query is required',
		});
	}

	const searchQuery = req.query.query;

	News.find(
		{
			$text: {
				$search: searchQuery,
			},
		},
		(error, articles) => {
			if (error) {
				res.status(500).send(error);
			} else {
				res.send(articles);
			}
		}
	);
};
module.exports = searchNews;
