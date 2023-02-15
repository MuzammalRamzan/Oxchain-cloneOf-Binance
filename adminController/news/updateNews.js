const NewsModal = require("../../models/News");
const authFile = require('../../auth');
const Admin = require("../../models/Admin");
const uploadImage = require('../Posts/uploadImage');

const updateNews = async (req, res) => {
  try {
    const { user_id, api_key, author, title, description, category, file, fileExtension, is_top } = req.body;
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
        showableMessage: "You are not authorized to delete news"
      });
    }
    if (category == "business" || category == "markets" || category == "technology" || category == "policy") {
      const { id } = req.params;
      let checkForNews = await NewsModal.findOne({ _id: id, status: 1 }).exec();
      if (checkForNews) {
        if (result == null) {
          await NewsModal.findByIdAndUpdate(
            id
            , {
              author: author,
              title: title,
              description: description,
              category: category,
              is_top: is_top,
              createdAt: Date.now()
            }).exec();
        }
        else {
          await NewsModal.findByIdAndUpdate(
            id
            , {
              author: author,
              title: title,
              description: description,
              category: category,
              coverPhoto: result,
              is_top: is_top,
              createdAt: Date.now()
            }).exec();
        }
        return res.status(200).json({
          status: "success",
          message: "News Update",
          showableMessage: "News successfully Updated ",
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
module.exports = updateNews;
