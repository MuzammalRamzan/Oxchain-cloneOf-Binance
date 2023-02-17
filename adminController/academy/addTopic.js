const AcademyModal = require("../../models/Academy");
const Admin = require("../../models/Admin");
const authFile = require('../../auth');
const uploadImage = require('../Posts/uploadImage');

const addTopic = async (req, res) => {
  try {
    const { user_id, api_key, author, title, content, category, dificulty, timeDuration, file, fileExtension } = req.body;
    let coverPhotoUrl = null;
    if (file && fileExtension) {
      coverPhotoUrl = await uploadImage(file, fileExtension);
    }
    const isAuthenticated = await authFile.apiKeyChecker(api_key);
    if (!isAuthenticated) {
      return res.status(403).json({
        status: 'Failed',
        message: '403 Forbidden',
        showableMessage: 'Forbidden 403, Please provide valid api key'
      });
    }

    //// only admin can add topics
    var admin = await Admin.findOne({
      _id: user_id,
      status: 1
    });
    if (admin == null) {
      return res.json({
        status: "error",
        message: "Authorization Failed",
        showableMessage: "You are not authorized"
      });
    }
    // Validate request body
    if (
      !title ||
      !content ||
      !author ||
      !category ||
      !dificulty
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bad Request',
        showableMessage:
          'Topic title, content,category ,topic ,dificulty and author are required fields',
      });
    }

    const topicCheck = await AcademyModal.findOne({ title: title, category: category })
    if (topicCheck) {
      return res.status(200).json({
        status: "Success",
        message: "Topic already exist",
        showableMessage: "Topic already exist"
      })
    }
    const newTopic = new AcademyModal({
      author: author,
      title: title,
      content: content,
      category: category,
      dificulty: dificulty,
      timeDuration: timeDuration,
      coverPhoto: coverPhotoUrl,
      status: 1,
    });

    await newTopic.save();
    return res.status(200).json({
      status: 'success',
      message: 'success',
      showableMessage: 'Topic added successfully',
    });


  }
  catch (error) {
    // Log the error for debugging purposes
    console.error('err', error);
    return res.status(500).json({
      status: 'Failed',
      message: 'Internal Server Error',
      showableMessage: error.message,
    });
  }


};

module.exports = addTopic;
