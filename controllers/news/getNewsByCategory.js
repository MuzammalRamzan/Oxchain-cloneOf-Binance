const NewsModal = require("../../models/News");
const authFile = require('../../auth');

const getNews = async (req, res) => {
  try {
    const { api_key } = req.body;
    const isAuthenticated = await authFile.apiKeyChecker(api_key);
    if (!isAuthenticated) {
      return res.status(403).json({
        status: 'Failed',
        message: '403 Forbidden',
        showableMessage: 'Forbidden 403, Please provide valid api key'
      });
    }

    const { category } = req.query;

    if (category >= 1 && category <= 4) {
      const allNews = await NewsModal.find({ category: category, status: 1 }).sort({ createdAt: -1 })

      if (allNews.length > 0) {
        return res.status(200).json({
          status: "success",
          message: "News found",
          news: allNews,
        });
      } else
        return res.status(404).json({
          status: "Failed",
          message: "News not found",
          howableMessage: "News not found"
        });
    }
    else {
      return res.status(404).json({
        status: 'Failed',
        message: 'Category Failed',
        showableMessage: "Provided category not found",
      });
    }

  }
  catch (error) {
    // Log the error for debugging purposes
    return res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error',
      showableMessage: error.message,
    });
  }
}
module.exports = getNews;
