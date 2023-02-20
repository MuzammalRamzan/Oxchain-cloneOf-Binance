const AcademyModal = require("../../models/Academy");
const authFile = require('../../auth');
const Admin = require("../../models/Admin");
const uploadImage = require('../Posts/uploadImage');

const updateTopic = async (req, res) => {
  try {
    const { user_id, api_key, author, title, content, category, dificulty, timeDuration, file, fileExtension } = req.body;
    let result = null;
    if (file && fileExtension) {
      result = await uploadImage(file, fileExtension);
    }
    const isAuthenticated = await authFile.apiKeyChecker(api_key);
    if (!isAuthenticated) {
      return res.status(403).json({
        status: 'Failed',
        message: '403 Forbidden',
        showableMessage: 'Forbidden 403, Please provide valid api key'
      });
    }
    //// only admin can update news
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
    if (category == 'altcoin' ||
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
      category == 'tech') {
      const { id } = req.params;
      if (dificulty == 'beginner' ||
        dificulty == 'intermediate' ||
        dificulty == 'advanced') {
        let checkForTopic = await AcademyModal.findOne({ _id: id, status: 1 }).exec();
        if (checkForTopic) {
          if (result == null) {
            await AcademyModal.findByIdAndUpdate(
              id
              , {
                author: author,
                title: title,
                content: content,
                category: category,
                dificulty: dificulty,
                timeDuration: timeDuration,
                createdAt: Date.now()
              }).exec();
          }
          else {
            await AcademyModal.findByIdAndUpdate(
              id
              , {
                author: author,
                title: title,
                content: content,
                category: category,
                coverPhoto: result,
                dificulty: dificulty,
                timeDuration: timeDuration,
                createdAt: Date.now()
              }).exec();
          }
          return res.status(200).json({
            status: "success",
            message: "Topic Update",
            showableMessage: "Topic successfully Updated ",
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
      else {
        return res.status(404).json({
          status: 'Failed',
          message: 'dificulty not Found',
          showableMessage: "dificulty not Found",
        });
      }

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
      status: 'Failed',
      message: 'Internal Server Error',
      showableMessage: error.message,
    });
  }
}
module.exports = updateTopic;
