const NewsModal = require("../../models/News");
const Admin = require("../../models/Admin");
const authFile = require('../../auth');

const addNews = async (req, res) => {
  try {
    const { user_id, title, description, category, status, api_key } = req.body;
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
      _id: user_id
    });
    if (admin == null) {
      return res.json({
        status: "error",
        message: "Authorization Failed",
        showableMessage: "You are not authorized"
      });
    }
    var id = admin._id;
    ///// category only be 1 for business ,2 for markets,3 for technology , 4 for policy 
    if (category >= 1 && category <= 4) {
      const newsCheck = await NewsModal.findOne({ title: title, category: category })
      if (newsCheck) {
        return res.status(200).json({
          status: "Success",
          message: "News already exist",
          showableMessage: "News already exist"
        })
      }
      const newNews = new NewsModal({
        addedBy: id,
        title: title,
        description: description,
        category: category,
        status: status

      });

      const news = await newNews.save();
      return res.status(200).json({
        status: 'success',
        message: 'success',
        showableMessage: 'News added successfully',
      });
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
    console.error('err', error);
    return res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error',
      showableMessage: error.message,
    });
  }


};

module.exports = addNews;
