const Admin = require("../models/Admin");
const Users = require("../models/User");
var authFile = require("../auth.js");

const utilities = require("../utilities");
const userList = async (req, res) => {
  var apiKey = req.body.apiKey;

  if (apiKey == null) {
    return res.json({
      status: "error",
      message: "Api key is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }
  //burada kullanıcı listesi döndürülecek

  var user = await Users.find({});

  if (user == null) {
    return res.json({
      status: "error",
      message: "User list is null",
    });
  }

  res.json({
    status: "success",
    message: "User list is success",
    data: user,
  });
};

module.exports = userList;
