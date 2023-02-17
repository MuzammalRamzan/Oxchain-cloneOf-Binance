const NewsModal = require("../../models/News");
const authFile = require('../../auth');

const getTopNews = async (req, res) => {
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

    const allTopNews = await NewsModal.find({ is_top: true, status: 1 }).sort({ createdAt: -1 })

    if (allTopNews?.length > 0) {
      return res.status(200).json({
        status: "success",
        message: "News found",
        news: allTopNews,
      });
    } else
      return res.status(404).json({
        status: "Failed",
        message: "News not found",
        howableMessage: "News not found"
      });
  }
  catch (error) {
    // Log the error for debugging purposes
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error',
      showableMessage: error.message,
    });
  }
}
module.exports = getTopNews;
