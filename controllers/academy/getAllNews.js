const AcademyModal = require("../../models/Academy");
const authFile = require('../../auth');

const getAllTopics = async (req, res) => {
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
    const allTopics = await AcademyModal.find({ status: 1 }).sort({ createdAt: -1 });
    if (allTopics?.length > 0) {
      return res.status(200).json({
        status: "Success",
        message: "Topics found",
        news: allTopics,
      });
    } else
      return res.status(404).json({
        status: "Failed",
        message: "Topics not found",
        howableMessage: "Topics not found"
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
module.exports = getAllTopics;
