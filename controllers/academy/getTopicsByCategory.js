const AcademyModal = require("../../models/Academy");
const authFile = require('../../auth');

const getTopics = async (req, res) => {
  try {
    const { api_key } = req.body;
    const isAuthenticated = await authFile.apiKeyChecker(api_key);
    if (!isAuthenticated) {
      return res.status(403).json({
        status: 'Failed',
        message: '403 Forbidden',
        showableMessage: 'Forbidden 403, Please provide valid apikey ',
      });
    }

    const { category, dificulty } = req.query;

    if (
      category == 'altcoin' ||
      category == 'binance' ||
      category == 'bitcoin' ||
      category == 'blockchain' ||
      category == 'consensus' ||
      category == 'cryptography' ||
      category == 'defi' ||
      category == 'economics' ||
      category == 'essentials' ||
      category == 'ethereum' ||
      category == 'history' ||
      category == 'metaverse' ||
      category == 'mining' ||
      category == 'nft' ||
      category == 'tech'
    ) {
      const topics = await AcademyModal.find({
        category: category,
        status: 1,
      }).sort({ createdAt: -1 });

      if (topics.length > 0) {
        return res.status(200).json({
          status: 'success',
          message: 'Topic found',
          news: topics,
        });
      } else
        return res.status(404).json({
          status: 'Failed',
          message: 'Topic not found',
          howableMessage: 'Topic not found',
        });
    }
    else if (
      dificulty == 'beginner' ||
      dificulty == 'intermediate' ||
      dificulty == 'advanced'
    ) {
      const topics = await AcademyModal.find({
        dificulty: dificulty,
        status: 1,
      }).sort({ createdAt: -1 });

      if (topics.length > 0) {
        return res.status(200).json({
          status: 'success',
          message: 'Topic found',
          news: topics,
        });
      } else
        return res.status(404).json({
          status: 'Failed',
          message: 'Topic not found',
          howableMessage: 'Topic not found',
        });
    }
    else {
      return res.status(404).json({
        status: 'Failed',
        message: 'Category Failed',
        showableMessage: 'Provided category not found',
      });
    }
  } catch (error) {
    // Log the error for debugging purposes
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error',
      showableMessage: error.message,
    });
  }
};
module.exports = getTopics;
