const NewsModal = require("../../models/News");
const authFile = require('../../auth');
const Admin = require("../../models/Admin");

const deleteAllNews = async (req, res) => {
  try {
    const { api_key, user_id } = req.body;
    const isAuthenticated = await authFile.apiKeyChecker(api_key);
    if (!isAuthenticated) {
      return res.status(403).json({
        status: 'Failed',
        message: '403 Forbidden',
        showableMessage: 'Forbidden 403, Please provide valid api key'
      });
    }
    //// only admin can delete all news
    var admin = await Admin.findOne({
      _id: user_id,
      status: 1

    });
    if (admin == null) {
      return res.json({
        status: "error",
        message: "Authorization Failed",
        showableMessage: "You are not authorized to delete news"
      });
    }
    let checkForNews = await NewsModal.find().exec();
    if (checkForNews.length > 0) {
      for (let index = 0; index < checkForNews.length; index++) {
        await NewsModal.findByIdAndUpdate(
          checkForNews[index]._id
          , {
            status: 0,
            createdAt: Date.now()
          }).exec();

      }
      return res.status(200).json({
        status: "success",
        message: "News Deleted",
        showableMessage: "All News successfully deleted ",
      });

    }
    else {
      return res.status(404).json({
        status: 'Failed',
        message: 'News not Found',
        showableMessage: "News not Found",
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
module.exports = deleteAllNews;
