const AcademyModal = require("../../models/Academy");
const authFile = require('../../auth');
const Admin = require("../../models/Admin");

const deleteTopic = async (req, res) => {
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
    //// only admin can delete news
    var admin = await Admin.findOne({
      _id: user_id,
      status: 1
    });
    if (admin == null) {
      return res.json({
        status: "error",
        message: "Authorization Failed",
        showableMessage: "You are not authorized to delete topic"
      });
    }
    const { id } = req.params;
    let checkForTopic = await AcademyModal.findOne({ _id: id, status: 1 }).exec();
    if (checkForTopic) {
      ////0 for delete
      await AcademyModal.findByIdAndUpdate(
        id
        , {
          status: 0,
          createdAt: Date.now()
        }).exec();
      return res.status(200).json({
        status: "success",
        message: "Topic Deleted",
        showableMessage: "Topic successfully deleted ",
      });
    }
    else {
      return res.status(404).json({
        status: 'Failed',
        message: 'Topic not Found',
        showableMessage: "Topic not Found",
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
module.exports = deleteTopic;
