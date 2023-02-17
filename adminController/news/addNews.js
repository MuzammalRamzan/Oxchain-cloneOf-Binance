const NewsModal = require("../../models/News");
const Admin = require("../../models/Admin");
const authFile = require('../../auth');
const uploadImage = require('../Posts/uploadImage');

const addNews = async (req, res) => {
  try {
    const { user_id, api_key, author, title, description, category, file, fileExtension, is_top } = req.body;
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

    //// only admin can add news
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
      !description ||
      !author ||
      !category
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bad Request',
        showableMessage:
          'News title, description,category and author are required fields',
      });
    }
    ///// category only be  business , markets, technology , policy 
    const newsCheck = await NewsModal.findOne({ title: title, category: category })
    if (newsCheck) {
      return res.status(200).json({
        status: "Success",
        message: "News already exist",
        showableMessage: "News already exist"
      })
    }
    const newNews = new NewsModal({
      author: author,
      title: title,
      description: description,
      category: category,
      status: 1,
      coverPhoto: coverPhotoUrl,
      is_top: is_top
    });

    await newNews.save();
    return res.status(200).json({
      status: 'success',
      message: 'success',
      showableMessage: 'News added successfully',
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

module.exports = addNews;
