const AcademyModal = require("../../models/Academy");
const authFile = require('../../auth');
const Admin = require("../../models/Admin");

const deleteAllTopics = async (req, res) => {
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
        showableMessage: "You are not authorized to delete Topics"
      });
    }
    let checkForTopic = await AcademyModal.find().exec();
    if (checkForTopic.length > 0) {
      for (let index = 0; index < checkForTopic.length; index++) {
        await AcademyModal.findByIdAndUpdate(
          checkForTopic[index]._id
          , {
            status: 0,
            createdAt: Date.now()
          }).exec();

      }
      return res.status(200).json({
        status: "success",
        message: "Topics Deleted",
        showableMessage: "All Topics successfully deleted ",
      });

    }
    else {
      return res.status(404).json({
        status: 'Failed',
        message: 'Topics not Found',
        showableMessage: "Topics not Found",
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
module.exports = deleteAllTopics;
